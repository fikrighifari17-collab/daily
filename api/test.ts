import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result: any = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeVersion: process.version,
  };

  try {
    const count = await prisma.user.count();
    result.databaseConnected = true;
    result.userCount = count;
  } catch (err: any) {
    result.databaseConnected = false;
    result.databaseError = err.message || String(err);
  }

  return res.status(200).json(result);
}
