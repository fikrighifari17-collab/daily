import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { getJwtSecret } from '../lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

    const { username, password, nama, telegramChatId } = body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ error: 'Username harus memiliki panjang antara 3 hingga 30 karakter' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken, please choose another' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username: cleanUsername,
          nama: nama ? String(nama).trim().slice(0, 50) : cleanUsername,
          password: hashedPassword,
          telegramChatId: telegramChatId ? String(telegramChatId).trim() : null
        }
      });

      const secret = getJwtSecret();
      const token = jwt.sign({ userId: user.id, username: user.username }, secret, { expiresIn: '30d' });

      return res.status(201).json({
        token,
        user: { id: user.id, nama: user.nama, username: user.username, pinLock: user.pinLock, avatar: user.avatar, telegramChatId: user.telegramChatId }
      });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
