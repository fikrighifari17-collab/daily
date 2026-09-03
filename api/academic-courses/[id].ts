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
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const courseId = Number(id);

  if (isNaN(courseId)) {
    return res.status(400).json({ error: 'Invalid course ID' });
  }

  if (req.method === 'PUT') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const updateData: any = {};
      if (body.mataKuliah !== undefined) updateData.mataKuliah = String(body.mataKuliah).trim();
      if (body.dosen !== undefined) updateData.dosen = String(body.dosen).trim();
      if (body.hari !== undefined) updateData.hari = body.hari;
      if (body.jamMulai !== undefined) updateData.jamMulai = body.jamMulai;
      if (body.jamSelesai !== undefined) updateData.jamSelesai = body.jamSelesai;
      if (body.ruangan !== undefined) updateData.ruangan = String(body.ruangan).trim();
      if (body.sks !== undefined) updateData.sks = Number(body.sks);
      if (body.warna !== undefined) updateData.warna = body.warna;
      if (body.link !== undefined) updateData.link = String(body.link).trim();
      if (body.attendance !== undefined) updateData.attendance = body.attendance;

      const course = await prisma.academicCourse.updateMany({
        where: { id: courseId, userId },
        data: updateData
      });

      if (course.count === 0) {
        return res.status(404).json({ error: 'Course not found or unauthorized' });
      }

      const updated = await prisma.academicCourse.findUnique({
        where: { id: courseId }
      });

      return res.status(200).json(updated);
    } catch (err: any) {
      console.error('Update academic course error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await prisma.academicCourse.deleteMany({
        where: { id: courseId, userId }
      });

      if (deleted.count === 0) {
        return res.status(404).json({ error: 'Course not found or unauthorized' });
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('Delete academic course error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
