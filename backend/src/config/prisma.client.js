import { PrismaClient } from '@prisma/client';

// One PrismaClient per process — avoids exhausting the connection pool when
// nodemon's hot reload would otherwise spin up a fresh instance per restart.
const isDev = process.env.NODE_ENV !== 'production';
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (isDev) {
  globalForPrisma.__prisma = prisma;
}
