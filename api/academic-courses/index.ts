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

  if (req.method === 'GET') {
    try {
      const courses = await prisma.academicCourse.findMany({
        where: { userId },
        orderBy: { id: 'asc' }
      });
      return res.status(200).json(courses);
    } catch (err: any) {
      console.error('Get academic courses error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      // Handle bulk sync
      if (body?.bulkCourses && Array.isArray(body.bulkCourses)) {
        const createdCourses = [];
        for (const item of body.bulkCourses) {
          if (!item.mataKuliah) continue;
          const c = await prisma.academicCourse.create({
            data: {
              userId,
              mataKuliah: String(item.mataKuliah).trim(),
              dosen: item.dosen ? String(item.dosen).trim() : 'Lecturer',
              hari: item.hari || 'Monday',
              jamMulai: item.jamMulai || '08:00',
              jamSelesai: item.jamSelesai || '10:00',
              ruangan: item.ruangan ? String(item.ruangan).trim() : 'Room 101',
              sks: Number(item.sks) || 3,
              warna: item.warna || '#00ADB5',
              link: item.link ? String(item.link).trim() : '',
              attendance: item.attendance || { present: 0, absent: 0, excused: 0, target: 16 }
            }
          });
          createdCourses.push(c);
        }
        return res.status(201).json(createdCourses);
      }

      const {
        mataKuliah,
        dosen,
        hari,
        jamMulai,
        jamSelesai,
        ruangan,
        sks,
        warna,
        link,
        attendance
      } = body || {};

      if (!mataKuliah) {
        return res.status(400).json({ error: 'Course name is required' });
      }

      const course = await prisma.academicCourse.create({
        data: {
          userId,
          mataKuliah: String(mataKuliah).trim(),
          dosen: dosen ? String(dosen).trim() : 'Lecturer',
          hari: hari || 'Monday',
          jamMulai: jamMulai || '08:00',
          jamSelesai: jamSelesai || '10:00',
          ruangan: ruangan ? String(ruangan).trim() : 'Room 101',
          sks: Number(sks) || 3,
          warna: warna || '#00ADB5',
          link: link ? String(link).trim() : '',
          attendance: attendance || { present: 0, absent: 0, excused: 0, target: 16 }
        }
      });

      return res.status(201).json(course);
    } catch (err: any) {
      console.error('Create academic course error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
