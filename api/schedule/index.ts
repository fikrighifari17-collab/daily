import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const schedules = await prisma.schedule.findMany({
        where: { userId },
        orderBy: { tanggal: 'asc' }
      });
      return res.status(200).json(schedules);
    } catch (err: any) {
      console.error('Get schedules error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const { judul, jenis, tanggal } = body || {};
      if (!judul || !jenis || !tanggal) {
        return res.status(400).json({ error: 'Title, type, and date are required' });
      }

      const schedule = await prisma.schedule.create({
        data: {
          userId,
          judul: String(judul).trim(),
          jenis: String(jenis).trim(),
          tanggal: new Date(tanggal)
        }
      });
      return res.status(201).json(schedule);
    } catch (err: any) {
      console.error('Create schedule error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
