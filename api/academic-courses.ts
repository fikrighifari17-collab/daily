import prisma from './lib/prisma.js';
import { verifyToken } from './lib/auth.js';

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.' });

  // GET: Fetch all courses for user
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

  // POST: Create single or bulk upload courses
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

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

  // Extract ID for PUT/DELETE
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }
  const rawId = req.query?.id || body?.id;
  const courseId = Number(rawId);

  // PUT: Update course
  if (req.method === 'PUT') {
    if (isNaN(courseId)) return res.status(400).json({ error: 'Invalid course ID' });
    try {
      const updateData: any = {};
      if (body.mataKuliah !== undefined) updateData.mataKuliah = String(body.mataKuliah).trim();
      if (body.dosen !== undefined) updateData.dosen = String(body.dosen).trim();
      if (body.hari !== undefined) updateData.hari = body.hari;
      if (body.jamMulai !== undefined) updateData.jamMulai = body.jamMulai;
      if (body.jamSelesai !== undefined) updateData.jamSelesai = body.jamSelesai;
      if (body.ruangan !== undefined) updateData.ruangan = String(body.ruangan).trim();
      if (body.sks !== undefined) updateData.sks = Number(body.sks);
      if (body.warna !== undefined) updateData.warna = body.warna;
      if (body.attendance !== undefined) {
        updateData.attendance = body.attendance;
      } else if (body.materials !== undefined) {
        const prevCourse = await prisma.academicCourse.findUnique({ where: { id: courseId } });
        const prevAtt = (prevCourse?.attendance as any) || { present: 0, absent: 0, excused: 0, target: 16 };
        updateData.attendance = { ...prevAtt, materials: body.materials };
      }

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

  // DELETE: Remove course
  if (req.method === 'DELETE') {
    if (isNaN(courseId)) return res.status(400).json({ error: 'Invalid course ID' });
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
