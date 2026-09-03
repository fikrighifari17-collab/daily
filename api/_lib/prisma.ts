const FALLBACK_DB_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
const FALLBACK_JWT_SECRET = "Jrfikrizero123SuperSecretDailyAuthKey2026";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DB_URL;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = FALLBACK_JWT_SECRET;
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const dbUrl = process.env.DATABASE_URL || FALLBACK_DB_URL;
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    return (client as any)[prop];
  }
});
