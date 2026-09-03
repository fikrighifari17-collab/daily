export default async function handler(req: any, res: any) {
  const info: any = {
    node: process.version,
    envDatabaseUrl: !!process.env.DATABASE_URL,
    steps: []
  };

  try {
    info.steps.push('importing @prisma/client');
    const { PrismaClient } = await import('@prisma/client');
    info.steps.push('instantiating PrismaClient');
    const prisma = new PrismaClient();
    info.steps.push('connecting');
    await prisma.$connect();
    info.steps.push('querying user count');
    const count = await prisma.user.count();
    info.steps.push('success');
    info.userCount = count;
    await prisma.$disconnect();
    return res.status(200).json({ ok: true, info });
  } catch (err: any) {
    return res.status(200).json({
      ok: false,
      info,
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack
    });
  }
}
