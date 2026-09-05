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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

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

  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const rawId = req.query?.id || (typeof body === 'object' ? body?.id : null);
      const scheduleId = Number(rawId);
      if (isNaN(scheduleId)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const { judul, jenis, tanggal } = body || {};
      const updateData: any = {};
      if (judul !== undefined) updateData.judul = String(judul).trim();
      if (jenis !== undefined) updateData.jenis = String(jenis).trim();
      if (tanggal !== undefined) updateData.tanggal = new Date(tanggal);

      const schedule = await prisma.schedule.update({
        where: { id: scheduleId },
        data: updateData
      });
      return res.status(200).json(schedule);
    } catch (err: any) {
      console.error('Update schedule error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const rawId = req.query?.id || (typeof req.body === 'object' ? req.body?.id : null);
    const scheduleId = Number(rawId);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    try {
      await prisma.schedule.deleteMany({
        where: { id: scheduleId, userId }
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
