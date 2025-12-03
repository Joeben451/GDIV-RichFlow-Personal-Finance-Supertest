import pkg from '@prisma/client';
import type { PrismaClient as PrismaClientType } from '@prisma/client';

const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Prisma Client Singleton
 * Prevents multiple instances of Prisma Client in development
 * 
 * Prisma 7 Migration: Uses driver adapters for database connections.
 * The @prisma/adapter-pg adapter handles PostgreSQL connections.
 */
let prisma: PrismaClientType;

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
};

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // In development, use a global variable to preserve the client across module reloads
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;