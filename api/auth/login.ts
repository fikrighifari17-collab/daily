import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { getJwtSecret, checkRateLimit, resetRateLimit } from '../lib/auth';

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

  const { username, password } = body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const clientIp = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip';
  const rateLimitKey = `login_${clientIp}_${cleanUsername}`;

  // Rate Limiting: max 5 failed attempts per 10 minutes
  const rateCheck = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Terlalu banyak percobaan login yang gagal. Silakan coba lagi dalam ${rateCheck.retryAfterSec} detik.`
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Login successful: reset rate limit attempts
    resetRateLimit(rateLimitKey);

    const secret = getJwtSecret();
    const token = jwt.sign({ userId: user.id, username: user.username }, secret, { expiresIn: '30d' });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        pinLock: user.pinLock,
        avatar: user.avatar,
        telegramChatId: user.telegramChatId || null
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
