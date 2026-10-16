import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithRetry } from '../lib/api';
import { HomeApiResponse } from '../types/home';

interface HomeDataContextType {
  data: HomeApiResponse | null;
  loading: boolean;
  error: boolean;
}

const defaultContextValue: HomeDataContextType = {
  data: null,
  loading: true,
  error: false,
};

const HomeDataContext = createContext<HomeDataContextType>(defaultContextValue);

/**
 * Fetches the aggregated public homepage payload (GET /api/public/home) ONCE
 * per language and shares it with every homepage section (Hero, Services,
 * Portfolio, Testimonials, Pricing) via context, instead of each section
 * making its own independent request.
 *
 * Why: on a normal load this halves round trips (1 request instead of 5).
 * More importantly, it means a single transient backend hiccup — e.g. a
 * cold-started Render instance or a Neon compute waking from autosuspend —
 * is handled by ONE bounded retry (see fetchWithRetry in src/lib/api.ts)
 * instead of five independent requests racing the same cold start and
 * failing separately with their own "فشل تحميل ..." messages.
 *
 * Scope: this provider should wrap only the public landing page tree (see
 * App.tsx). It intentionally does not wrap the admin panel or client portal,
 * which have their own independent data needs and already work correctly.
 */
export const HomeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [data, setData] = useState<HomeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchWithRetry<{ data: HomeApiResponse }>('/api/public/home')
      .then((res) => {
        if (cancelled) return;
        setData(res.data?.data ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  return (
    <HomeDataContext.Provider value={{ data, loading, error }}>
      {children}
    </HomeDataContext.Provider>
  );
};

export const useHomeData = (): HomeDataContextType => useContext(HomeDataContext);
