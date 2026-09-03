import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { judul, jenis, tanggal } = req.body;
      if (!judul || !jenis || !tanggal) {
        return res.status(400).json({ error: 'Title, type, and date are required' });
      }

      const schedule = await prisma.schedule.create({
        data: {
          userId,
          judul,
          jenis,
          tanggal: new Date(tanggal)
        }
      });
      return res.status(201).json(schedule);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
