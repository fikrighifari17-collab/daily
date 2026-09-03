import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
      const { nama } = req.body;
      if (!nama) return res.status(400).json({ error: 'Tag name is required' });

      const tag = await prisma.tag.create({
        data: { userId, nama }
      });
      return res.status(201).json(tag);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
