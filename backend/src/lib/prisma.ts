import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations in TypeScript
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Global singleton PrismaClient instance.
 * Reusing a single client across the entire application prevents connection pool thrashing,
 * exhausts fewer database connections on serverless/pooled PostgreSQL (Neon),
 * and keeps pooled connections warm for fast queries.
 */
export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
