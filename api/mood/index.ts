import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const { moodScore, catatan, voiceNotePath, photoUrl, waktu, tanggal, tagIds } = body || {};
      const entry = await prisma.moodEntry.create({
        data: {
          userId,
          moodScore: Number(moodScore),
          catatan: catatan ? String(catatan) : null,
          voiceNotePath: voiceNotePath ? String(voiceNotePath) : null,
          photoUrl: photoUrl ? String(photoUrl) : null,
          waktu: waktu || '08:00 AM',
          tanggal: new Date(tanggal || Date.now()),
          tags: {
            create: (tagIds || []).map((tagId: number) => ({ tagId }))
          }
        },
        include: { tags: { include: { tag: true } } }
      });
      return res.status(201).json(entry);
    } catch (err: any) {
      console.error('Create mood error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const entries = await prisma.moodEntry.findMany({
        where: { userId },
        include: { tags: { include: { tag: true } } },
        orderBy: { tanggal: 'desc' },
      });
      return res.status(200).json(entries);
    } catch (err: any) {
      console.error('Get moods error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
