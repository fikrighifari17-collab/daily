import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../lib/auth.js';

export default async function handler(req: any, res: any) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.' });

  if (req.method === 'GET') {
    try {
      const dumps = await prisma.brainDump.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(dumps);
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

      const { isi } = body || {};
      if (!isi) return res.status(400).json({ error: 'Isi pikiran tidak boleh kosong' });

      const cleanIsi = String(isi).trim().slice(0, 10000);
      const dump = await prisma.brainDump.create({
        data: { userId, isi: cleanIsi }
      });
      return res.status(201).json(dump);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
