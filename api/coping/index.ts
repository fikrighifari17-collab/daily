import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
      const { namaStrategi, deskripsi } = req.body;
      if (!namaStrategi) return res.status(400).json({ error: 'Strategy name is required' });

      const strategy = await prisma.copingStrategy.create({
        data: { userId, namaStrategi, deskripsi }
      });
      return res.status(201).json(strategy);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
