import pino from 'pino';
import { env } from '../config/env.config';

const isProd = env.NODE_ENV === 'production';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  // pino-http logs every request with its full header set by default, which put the bearer access
  // token (Authorization) and the 30-day refresh-token cookie into the platform logs. Redact them
  // here, at the logger level: pino-http ignores a `redact` option when it is handed a ready-made
  // logger instance.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'res.headers["set-cookie"]',
    ],
    censor: '[Redacted]',
  },
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception thrown');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled Promise Rejection');
  process.exit(1);
});
