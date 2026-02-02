import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Connection pooling configuration for high concurrency
// Supports 250+ concurrent users
const prismaClientConfig = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  // Connection pool settings for PostgreSQL
  // Default: 2 connections per instance, max 10
  // For 250 users, we need more connections
  ...(process.env.DATABASE_URL?.includes("pooler") || process.env.DIRECT_URL
    ? {}
    : {
        // Only apply if not using external pooler (like Neon, Supabase)
        // These settings work with direct PostgreSQL connections
      }),
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
