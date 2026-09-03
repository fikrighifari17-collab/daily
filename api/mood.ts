import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = SUPABASE_URL;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "Jrfikrizero123SuperSecretDailyAuthKey2026";
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

function verifyToken(req: any): number | null {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Jrfikrizero123SuperSecretDailyAuthKey2026") as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  let userId = verifyToken(req);
  if (!userId) {
    const userHeader = req.headers?.['x-user-username'] || req.query?.username;
    if (userHeader) {
      try {
        const u = await prisma.user.findUnique({
          where: { username: String(userHeader).trim().toLowerCase() }
        });
        if (u) userId = u.id;
      } catch {}
    }
  }
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

  if (req.method === 'DELETE') {
    const rawId = req.query?.id || (typeof req.body === 'object' ? req.body?.id : null);
    const moodId = Number(rawId);
    if (isNaN(moodId)) {
      return res.status(400).json({ error: 'Invalid ID' });
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
