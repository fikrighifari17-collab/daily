import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

const DEFAULT_SECRET = "Jrfikrizero123SuperSecretDailyAuthKey2026";

export function verifyToken(req: any): number | null {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
    const decoded = jwt.verify(token, secret) as { userId: number };
    return decoded.userId;
  } catch (err) {
    console.error('JWT verify error:', err);
    return null;
  }
}
