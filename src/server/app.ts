import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { MulterError } from 'multer';
import { pinoHttp } from 'pino-http';
import { logger } from './core/logger/pino.logger';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import mediaRoutes from './routes/media.routes';
import clientRoutes from './routes/client.routes';
import messageRoutes from './routes/message.routes';
import serviceRoutes from './routes/service.routes';
import pricingRoutes from './routes/pricing.routes';
import heroRoutes from './routes/hero.routes';
import testimonialRoutes from './routes/testimonial.routes';
import settingRoutes from './routes/setting.routes';
import publicRoutes from './routes/public.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import contractRoutes from './routes/contract.routes';
import notificationRoutes from './routes/notification.routes';
import clientPortalRoutes from './routes/client-portal.routes';
import { globalLimiter } from './middlewares/rate-limit.middleware';
import { ApiError } from './core/errors/api-error';
import { UPLOAD_ROOT } from './utils/upload';
import { prisma } from '../lib/prisma';

const app = express();

app.set('trust proxy', 1);
app.use(compression());

// Security & Request Logging Middleware
app.use(pinoHttp({ logger }));
app.use(helmet());

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header (server-to-server calls, curl, health checks)
      if (!origin || origin === allowedOrigin) {
        return callback(null, true);
      }
      return callback(new ApiError(403, 'Forbidden: origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// Uploaded media is public by design and is loaded by the frontend from a different origin
// (Vercel -> this API). helmet() sets `Cross-Origin-Resource-Policy: same-origin` on every response,
// which makes browsers refuse to render these files as <img>/<video> on another site, so it is
// relaxed for this path only. File names are random UUIDs and never reused, so they can be cached
// hard.
app.use(
  '/uploads',
  express.static(path.resolve(UPLOAD_ROOT), {
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);
app.use('/api', globalLimiter);

// Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/client', clientPortalRoutes);

// Health check endpoint (public: only reports coarse status, no runtime/version details)
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0',
  });
});

// Readiness check endpoint
app.get('/api/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (err: any) {
    // The driver's error message can contain connection details (host, user, database), so it is
    // logged for us but not returned to an unauthenticated caller.
    logger.error({ err }, 'Readiness check failed');
    res.status(503).json({ status: 'not ready' });
  }
});

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err }, 'Global Error Handler');
  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File exceeds the maximum allowed upload size of 500MB'
      : err.code === 'LIMIT_FILE_COUNT'
        ? 'A maximum of 10 files can be uploaded at once'
        : 'Invalid upload request';
    return res.status(400).json({ success: false, error: message });
  }
  const statusCode = err instanceof ApiError ? err.statusCode : err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // ApiError instances are intentional, designed-for-the-client errors
  // (validation failures, permission/auth errors, not-found, etc.) — their
  // message is always safe to show. Anything else reaching this handler is
  // unexpected (a bug, a database/driver error, a missing-config error, etc.)
  // and must never leak its raw message or internal details in production.
  const isIntentionalError = err instanceof ApiError;
  // Framework-raised 4xx errors (e.g. body-parser rejecting malformed JSON) are the caller's
  // mistake, not a server fault: answer with a generic 4xx message instead of the misleading
  // "Internal Server Error" that used to accompany a 400.
  const isFrameworkClientError = !isIntentionalError && statusCode >= 400 && statusCode < 500;
  const message = isIntentionalError || isDevelopment
    ? (err.message || 'Internal Server Error')
    : isFrameworkClientError
      ? 'Invalid request'
      : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err instanceof ApiError && err.details && { details: err.details }),
    ...(isDevelopment && { stack: err.stack }),
  });
});

export default app;
