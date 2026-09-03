import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    const userCount = await prisma.user.count();
    const hash = await bcrypt.hash('test', 10);
    const valid = await bcrypt.compare('test', hash);
    const token = jwt.sign({ test: 1 }, 'secret');

    return res.status(200).json({
      ok: true,
      userCount,
      bcryptWorks: valid,
      jwtWorks: !!token
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack
    });
  }
}
