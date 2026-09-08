import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Supabase Transaction Pooler (port 6543 with pgbouncer) - optimal for Vercel Serverless Functions
const SUPABASE_POOLER_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = SUPABASE_POOLER_URL;
    }
    _client = globalForPrisma.prisma ?? new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || SUPABASE_POOLER_URL
        }
      },
      log: ['error', 'warn']
    });
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _client;
    }
  }
  return _client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});

export default prisma;
