// Use o Prisma client gerado pelo server (schema com status, approvedAt, etc.)
// O npm run db:generate no client escreve em server/node_modules
import { PrismaClient } from '../../server/node_modules/@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
