import { ApiError } from './api-error';

/**
 * Shape of a Prisma "known request error" (e.g. P2002 unique constraint violation,
 * P2025 record not found, etc.). We deliberately do NOT import Prisma's actual
 * PrismaClientKnownRequestError class here and check with `instanceof` — that class's
 * export path has moved between Prisma major versions (and isn't re-exported from the
 * public '@prisma/client' entry point in Prisma 7.x), which makes `instanceof` checks
 * fragile and version-dependent. Every Prisma known-request error always carries a
 * string `.code` property, so a structural (duck-typed) check is more stable and needs
 * no import at all.
 */
interface PrismaKnownRequestErrorShape {
  code: string;
  meta?: { target?: string[] | string };
}

function isPrismaKnownRequestError(error: unknown): error is PrismaKnownRequestErrorShape {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/** True when the error is a Prisma P2002 unique-constraint violation. */
export function isUniqueConstraintError(error: unknown): boolean {
  return isPrismaKnownRequestError(error) && error.code === 'P2002';
}

/**
 * Translates a Prisma P2002 (unique constraint violation) error into a clean 400 ApiError.
 *
 * Why this exists: several services do a "does this already exist?" read (findUnique/findFirst)
 * before calling create()/update(). That check-then-insert pattern has a race window — two
 * concurrent requests can both pass the read check and only the database's unique constraint
 * will catch the second write, which previously surfaced as an unhandled 500 instead of a
 * clean validation error. Wrap the write call in try/catch and pass the caught error here.
 *
 * Any error that is not a P2002 unique-constraint violation is rethrown unchanged so normal
 * error handling (asyncHandler -> global error handler) still applies.
 */
export function handleUniqueConstraintError(error: unknown, fallbackMessage = 'A record with this value already exists'): never {
  if (isPrismaKnownRequestError(error) && error.code === 'P2002') {
    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target.join(', ') : typeof target === 'string' ? target : undefined;
    throw ApiError.badRequest(fields ? `${fallbackMessage} (${fields})` : fallbackMessage);
  }
  throw error;
}
