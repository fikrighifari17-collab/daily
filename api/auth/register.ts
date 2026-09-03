import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nama, email, password } = req.body || {};
  if (!nama || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nama, email, password: hashedPassword }
    });

    const secret = process.env.JWT_SECRET || 'fallback-secret-for-local-dev';
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '30d' });

    return res.status(201).json({
      token,
      user: { id: user.id, nama: user.nama, email: user.email, pinLock: user.pinLock }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
