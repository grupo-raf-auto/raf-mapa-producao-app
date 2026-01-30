import { prisma } from '../lib/prisma';

// Clean up database after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
