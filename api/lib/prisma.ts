import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Supabase Transaction Pooler (port 6543 with pgbouncer) - optimal for Vercel Serverless Functions
const SUPABASE_POOLER_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

const databaseUrl = process.env.DATABASE_URL || SUPABASE_POOLER_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
