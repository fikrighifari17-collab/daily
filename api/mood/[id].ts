import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const moodId = Number(id);

  if (isNaN(moodId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.moodEntry.deleteMany({
        where: { id: moodId, userId }
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { moodScore, catatan, waktu, tanggal } = req.body;
      const updated = await prisma.moodEntry.update({
        where: { id: moodId },
        data: {
          moodScore: moodScore ? Number(moodScore) : undefined,
          catatan,
          waktu,
          tanggal: tanggal ? new Date(tanggal) : undefined,
        },
        include: { tags: { include: { tag: true } } }
      });
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
