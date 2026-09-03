import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, nama } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const cleanUsername = String(username).trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      return res.status(400).json({ error: 'Username sudah digunakan, silakan pilih username lain' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        nama: nama ? String(nama).trim() : cleanUsername,
        password: hashedPassword
      }
    });

    const secret = process.env.JWT_SECRET || 'fallback-secret-for-local-dev';
    const token = jwt.sign({ userId: user.id, username: user.username }, secret, { expiresIn: '30d' });

    return res.status(201).json({
      token,
      user: { id: user.id, nama: user.nama, username: user.username, pinLock: user.pinLock }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
