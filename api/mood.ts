import prisma from './lib/prisma';
import { verifyToken } from './lib/auth';

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.' });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const { moodScore, catatan, voiceNotePath, photoUrl, waktu, tanggal, tagIds } = body || {};

      const numScore = Math.max(1, Math.min(5, Math.round(Number(moodScore) || 3)));
      const cleanCatatan = catatan ? String(catatan).trim().slice(0, 5000) : null;

      const entry = await prisma.moodEntry.create({
        data: {
          userId,
          moodScore: numScore,
          catatan: cleanCatatan,
          voiceNotePath: voiceNotePath ? String(voiceNotePath) : null,
          photoUrl: photoUrl ? String(photoUrl) : null,
          waktu: waktu ? String(waktu).trim().slice(0, 30) : '08:00 AM',
          tanggal: new Date(tanggal || Date.now()),
          tags: {
            create: (Array.isArray(tagIds) ? tagIds : []).map((tagId: number) => ({ tagId: Number(tagId) }))
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

  if (req.method === 'DELETE') {
    const rawId = req.query?.id || (typeof req.body === 'object' ? req.body?.id : null);
    const moodId = Number(rawId);
    if (isNaN(moodId)) {
      return res.status(400).json({ error: 'ID tidak valid' });
    }
    try {
      await prisma.moodEntry.deleteMany({
        where: { id: moodId, userId }
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
