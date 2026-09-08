import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../lib/auth.js';

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.' });

  if (req.method === 'GET') {
    try {
      const strategies = await prisma.copingStrategy.findMany({
        where: { userId },
        orderBy: { id: 'desc' }
      });
      return res.status(200).json(strategies);
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

      const { namaStrategi, deskripsi } = body || {};
      if (!namaStrategi) return res.status(400).json({ error: 'Nama strategi wajib diisi' });

      const strategy = await prisma.copingStrategy.create({
        data: {
          userId,
          namaStrategi: String(namaStrategi).trim().slice(0, 100),
          deskripsi: deskripsi ? String(deskripsi).trim().slice(0, 1000) : null
        }
      });
      return res.status(201).json(strategy);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
