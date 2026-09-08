import prisma from './lib/prisma.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const userCount = await prisma.user.count();
    return res.status(200).json({
      status: 'ok',
      message: 'Semestara Backend & Database Supabase Connected!',
      timestamp: new Date().toISOString(),
      userCount
    });
  } catch (err: any) {
    console.error('Health check failed:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: err?.message || String(err),
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined
    });
  }
}
