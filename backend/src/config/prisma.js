import { PrismaClient } from '@prisma/client';

// Singleton Prisma client shared across the app (avoids exhausting DB connections on hot-reload).
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
