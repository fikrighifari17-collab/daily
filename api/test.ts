const SUPABASE_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = SUPABASE_URL;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "Jrfikrizero123SuperSecretDailyAuthKey2026";
}

export default async function handler(req: any, res: any) {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const userCount = await prisma.user.count();
    await prisma.$disconnect();

    return res.status(200).json({
      ok: true,
      userCount,
      message: 'Successfully connected to Supabase from Vercel!'
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
