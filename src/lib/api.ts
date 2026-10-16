/// <reference types="vite/client" />
import axios, { InternalAxiosRequestConfig, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured;

  if (import.meta.env.DEV) {
    // No VITE_API_URL set locally — assume the default local backend port.
    return 'http://localhost:5000';
  }

  // Production build with no VITE_API_URL configured: fail loudly instead of
  // silently sending every request to localhost (which would just hang or
  // fail with a confusing network error for real users). This turns a
  // missing Vercel environment variable into an immediately obvious error.
  throw new Error(
    'VITE_API_URL is not set. Configure it in the Vercel project environment variables before deploying.'
  );
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Bounded request timeout. Previously unset, so a slow/cold backend (e.g. a
  // Render free-tier instance waking up, or Neon's compute autosuspend) could
  // leave a request hanging indefinitely with no feedback to the user. 15s is
  // long enough to ride out a typical cold-start delay for a single request,
  // short enough that the UI is never stuck waiting forever — combined with
  // fetchWithRetry() below, a slow wake-up gets multiple bounded attempts
  // instead of one unbounded one.
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Access Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const currentLang = localStorage.getItem('yf_lang') || 'ar';
    if (config.headers) {
      config.headers['Accept-Language'] = currentLang;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token rotation
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const { token } = response.data;
          setAccessToken(token);
          isRefreshing = false;

          processQueue(null, token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        setAccessToken(null);

        // Redirect to admin login if refresh fails and user is on an admin page
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Bounded retry helper for transient read failures (cold starts, brief
// network blips, 5xx/429 responses). Reuses the shared `api` instance above,
// so the Accept-Language header, auth header, and 401/refresh interceptor
// still apply on every attempt — this is not a competing request system,
// just a thin wrapper around `api.get`.
//
// Only meant for safe-to-retry, read-only GET requests (e.g. public
// homepage data). It is intentionally NOT wired into every request
// automatically: retrying writes (POST/PUT/DELETE) or authenticated requests
// by default would risk duplicate side effects, so callers opt in explicitly.
// ---------------------------------------------------------------------------
export interface FetchWithRetryOptions {
  /** Number of retries AFTER the initial attempt. Total attempts = retries + 1. Default: 2 (3 attempts total). */
  retries?: number;
  /** Base delay between attempts, in ms. Grows linearly with each retry (attempt 1: 1x, attempt 2: 2x, ...). Default: 1000ms. */
  retryDelayMs?: number;
}

function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return true;
  // No response at all means the request never completed: network error,
  // DNS failure, connection reset, or our own 15s timeout above — all
  // transient conditions worth a bounded retry.
  if (!error.response) return true;
  const status = error.response.status;
  // Retry only on server-side/transient failures. A 4xx (bad request, auth,
  // not found, validation) will fail again identically on retry, so retrying
  // it just delays showing the real error to the user for no benefit.
  return status >= 500 || status === 429;
}

export async function fetchWithRetry<T = any>(
  url: string,
  config: AxiosRequestConfig = {},
  options: FetchWithRetryOptions = {}
): Promise<AxiosResponse<T>> {
  const { retries = 2, retryDelayMs = 1000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await api.get<T>(url, config);
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === retries;
      if (isLastAttempt || !isRetryableError(err)) {
        // Preserve the original error for the caller rather than wrapping it.
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    }
  }

  // Unreachable in practice (the loop above always returns or throws), but
  // keeps TypeScript satisfied about the function's return type.
  throw lastError;
}
