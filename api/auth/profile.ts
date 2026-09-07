import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { verifyToken, getJwtSecret } from '../lib/auth';

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
        updateData.nama = String(nama).trim().slice(0, 50);
      }

      if (avatar !== undefined) {
        updateData.avatar = avatar; // base64 or URL
      }

      if (username && username.trim().toLowerCase() !== user.username) {
        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.length < 3 || cleanUsername.length > 30) {
          return res.status(400).json({ error: 'Username harus antara 3 hingga 30 karakter' });
        }
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

      const secret = getJwtSecret();
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
