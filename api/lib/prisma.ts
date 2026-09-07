import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const SUPABASE_FALLBACK_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

const databaseUrl = process.env.DATABASE_URL || SUPABASE_FALLBACK_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
