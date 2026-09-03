import bcrypt from 'bcryptjs';
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nama: true, username: true, avatar: true, pinLock: true, createdAt: true }
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json(user);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const { nama, username, avatar, currentPassword, newPassword } = body || {};

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const updateData: any = {};

      if (nama !== undefined) {
        updateData.nama = String(nama).trim();
      }

      if (avatar !== undefined) {
        updateData.avatar = avatar; // base64 or URL
      }

      if (username && username.trim().toLowerCase() !== user.username) {
        const cleanUsername = username.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (existing && existing.id !== userId) {
          return res.status(400).json({ error: 'Username is already taken by another user' });
        }
        updateData.username = cleanUsername;
      }

      // Password update
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password' });
        }
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, nama: true, username: true, avatar: true, pinLock: true, createdAt: true }
      });

      const secret = process.env.JWT_SECRET || 'Jrfikrizero123SuperSecretDailyAuthKey2026';
      const token = jwt.sign({ userId: updatedUser.id, username: updatedUser.username }, secret, { expiresIn: '30d' });

      return res.status(200).json({
        user: updatedUser,
        token
      });
    } catch (err: any) {
      console.error('Update profile error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
