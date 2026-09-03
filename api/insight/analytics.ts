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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const moods = await prisma.moodEntry.findMany({
      where: { userId },
      include: { tags: { include: { tag: true } } },
      orderBy: { tanggal: 'asc' }
    });

    const schedules = await prisma.schedule.findMany({
      where: { userId },
      orderBy: { tanggal: 'asc' }
    });

    // Compute average mood
    const avgMood = moods.length
      ? Number((moods.reduce((acc, curr) => acc + curr.moodScore, 0) / moods.length).toFixed(1))
      : 0;

    // Compute academic workload correlation (schedules vs mood on same date)
    const dateMap: Record<string, { moodSum: number; moodCount: number; academicCount: number }> = {};

    moods.forEach((m) => {
      const dateStr = m.tanggal.toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { moodSum: 0, moodCount: 0, academicCount: 0 };
      }
      dateMap[dateStr].moodSum += m.moodScore;
      dateMap[dateStr].moodCount += 1;
    });

    schedules.forEach((s) => {
      const dateStr = s.tanggal.toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { moodSum: 0, moodCount: 0, academicCount: 0 };
      }
      dateMap[dateStr].academicCount += 1;
    });

    const dailyTrends = Object.keys(dateMap)
      .sort()
      .map((date) => {
        const item = dateMap[date];
        return {
          date,
          avgMood: item.moodCount ? Number((item.moodSum / item.moodCount).toFixed(1)) : null,
          academicLoad: item.academicCount
        };
      });

    return res.status(200).json({
      totalMoodEntries: moods.length,
      averageMood: avgMood,
      totalSchedules: schedules.length,
      dailyTrends
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
