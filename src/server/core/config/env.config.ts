import { z } from 'zod';
import 'dotenv/config';

/**
 * Parses a boolean-ish environment variable. `z.coerce.boolean()` must NOT be used for env vars:
 * it calls Boolean(value), so the string "false" becomes `true`. Accepts true/false/1/0
 * (case-insensitive); an empty value is treated as false; unset stays `undefined`.
 */
const booleanFromEnv = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.enum(['', 'true', 'false', '1', '0']))
  .transform((value) => value === 'true' || value === '1')
  .optional();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  REFRESH_TOKEN_HASH_SECRET: z.string().min(16, 'REFRESH_TOKEN_HASH_SECRET must be at least 16 characters'),
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL').default('http://localhost:5173'),
  PUBLIC_URL: z.string().url('PUBLIC_URL must be a valid URL').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  // Outbound email (contact form "Email" option). All optional: if unset, the
  // email service simply skips sending and logs a warning — it never blocks
  // message creation, and no credentials are ever hardcoded in source.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  // NOTE: port 465 uses implicit TLS and needs SMTP_SECURE=true; port 587 uses STARTTLS and needs
  // SMTP_SECURE=false.
  SMTP_SECURE: booleanFromEnv,
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  // Google Sign-In (Google Identity Services). Optional: the /api/auth/google
  // endpoint rejects with a clear error if this isn't configured, but the rest
  // of the app boots and works normally without it.
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
