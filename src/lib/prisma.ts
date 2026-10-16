import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// An idle pooled connection can be dropped by the server side (Neon suspends idle compute).
// pg-pool re-emits that as an 'error' event on the pool, and an EventEmitter 'error' with no
// listener is an uncaught exception — which the process-level handler in pino.logger.ts turns into
// process.exit(1). Handling it here only logs it: the pool discards the dead client and opens a
// fresh one on the next query. (Deliberately console.error, not the pino logger: this module is
// also imported by scripts that don't load the server's env validation.)
pool.on('error', (error) => {
  console.error('[pg-pool] idle client error (connection will be replaced):', error.message);
});

const adapter = new PrismaPg(pool);

declare global {
  var prisma: PrismaClient | undefined;
}

// Query-level logging can include bound parameter values (potentially
// sensitive application data), so it's only enabled outside production.
// Error and warning logging stay on in every environment for diagnostics.
const prismaLogLevels: Array<'query' | 'error' | 'warn'> =
  process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'];

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: prismaLogLevels,
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
