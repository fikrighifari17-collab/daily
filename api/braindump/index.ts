import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
      const { isi } = req.body;
      if (!isi) return res.status(400).json({ error: 'Note content cannot be empty' });

      const dump = await prisma.brainDump.create({
        data: { userId, isi }
      });
      return res.status(201).json(dump);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
