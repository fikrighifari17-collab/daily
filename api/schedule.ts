import prisma from './lib/prisma';
import { verifyToken } from './lib/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.' });
  }

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
        return res.status(400).json({ error: 'Judul, jenis, dan tanggal wajib diisi' });
      }

      const schedule = await prisma.schedule.create({
        data: {
          userId,
          judul: String(judul).trim(),
          jenis: String(jenis).trim().toLowerCase(),
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
        return res.status(400).json({ error: 'ID tidak valid' });
      }

      // Ensure user owns this schedule item before updating
      const existing = await prisma.schedule.findFirst({
        where: { id: scheduleId, userId }
      });
      if (!existing) {
        return res.status(404).json({ error: 'Tugas tidak ditemukan atau bukan milik Anda' });
      }

      const { judul, jenis, tanggal } = body || {};
      const updateData: any = {};
      if (judul !== undefined) updateData.judul = String(judul).trim();
      if (jenis !== undefined) updateData.jenis = String(jenis).trim().toLowerCase();
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
      return res.status(400).json({ error: 'ID tidak valid' });
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
