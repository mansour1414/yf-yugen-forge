import rateLimit from 'express-rate-limit';

// Global fallback limiter applied to all API routes as defense-in-depth.
// Route-specific limiters (authLimiter, messageLimiter) remain stricter and take precedence
// on their own routes since Express runs middlewares in registration order.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

// Dedicated limiter for POST /api/auth/refresh. The frontend's AuthProvider probes for a session on
// every page load, so anonymous visitors hit this endpoint too (and get an instant 401). Sharing
// authLimiter meant those probes ate the same per-IP quota as real sign-ins, so on a shared IP (an
// office, a mobile carrier's NAT) enough visitors could lock a real admin out of logging in.
// Requests without a refresh cookie are not counted; real sessions still are.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.cookies?.refreshToken,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many messages sent from this IP, please try again later.',
    });
  },
});
