import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../lib/auth.js';

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.' });

  if (req.method === 'GET') {
    try {
      const tags = await prisma.tag.findMany({
        where: { userId },
        orderBy: { nama: 'asc' }
      });
      return res.status(200).json(tags);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const { nama } = body || {};
      if (!nama) return res.status(400).json({ error: 'Nama tag wajib diisi' });

      const cleanNama = String(nama).trim().slice(0, 50);
      const tag = await prisma.tag.create({
        data: { userId, nama: cleanNama }
      });
      return res.status(201).json(tag);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
