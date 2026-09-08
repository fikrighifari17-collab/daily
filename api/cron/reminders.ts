import prisma from '../lib/prisma';
import {
  notifyServerClassReminder,
  notifyServerDeadlineReminder,
  notifyServerOverdueTaskReminder,
  notifyServerImpendingDeadlineReminder
} from '../lib/telegram';

function parseScheduleMeta(s: any) {
  let title = s?.judul || 'Tanpa Judul';
  let startTime: string | null = null;
  let deadlineTime: string | null = null;
  let progress = 0;
  let reminderBefore: number | null = null;

  // Extract [Meta:...]
  const metaPrefix = '[Meta:';
  const metaIdx = title.lastIndexOf(metaPrefix);
  if (metaIdx !== -1) {
    const afterMeta = title.substring(metaIdx + metaPrefix.length);
    const lastBracketIdx = afterMeta.lastIndexOf(']');
    if (lastBracketIdx !== -1) {
      const jsonCandidate = afterMeta.substring(0, lastBracketIdx).trim();
      try {
        const parsedMeta = JSON.parse(jsonCandidate);
        if (typeof parsedMeta.progress === 'number') {
          progress = Math.max(0, Math.min(100, Math.round(parsedMeta.progress)));
        }
        if (parsedMeta.reminderBefore && !isNaN(Number(parsedMeta.reminderBefore))) {
          reminderBefore = Number(parsedMeta.reminderBefore);
        }
      } catch {}
      title = title.substring(0, metaIdx).trim();
    }
  }

  // Extract (Mulai: ...)
  const startMatch = title.match(/\(Mulai:\s*([^\)]+)\)/i);
  if (startMatch) {
    startTime = startMatch[1].trim();
    title = title.replace(/\(Mulai:\s*[^\)]+\)/i, '').trim();
  }

  // Extract [Deadline: ...]
  const deadlineMatch = title.match(/\[Deadline:\s*([^\]]+)\]/i);
  if (deadlineMatch) {
    deadlineTime = deadlineMatch[1].trim();
    title = title.replace(/\[Deadline:\s*[^\]]+\]/i, '').trim();
  }

  return {
    ...s,
    cleanTitle: title.trim() || s?.judul || 'Tanpa Judul',
    startTime,
    deadlineTime: deadlineTime || '23:59',
    progress,
    reminderBefore
  };
}

export default async function handler(req: any, res: any) {
  // Allow GET and POST for cron runners
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Optional security: CRON_SECRET check
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && req.query?.secret !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
  }

  try {
    // 1. Calculate current WIB (UTC+7) Date and Time
    const now = new Date();
    const wibDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now); // "YYYY-MM-DD"
    const wibDayEn = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(now).toLowerCase();
    const wibDayId = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(now).toLowerCase();
    const wibTimeStr = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(now);
    const [nowH, nowM] = wibTimeStr.split(':').map(Number);
    const nowMinutes = nowH * 60 + nowM;

    // 2. Fetch all users who configured Telegram Chat ID
    const users = await prisma.user.findMany({
      where: {
        telegramChatId: {
          not: null
        }
      },
      include: {
        academicCourses: true,
        schedules: true
      }
    });

    let sentCount = 0;
    const sentLogs: string[] = [];

    for (const user of users) {
      if (!user.telegramChatId) continue;
      const displayName = user.nama || user.username || 'Sobat Semestara';

      // ─── A. Pengingat Kelas Kuliah (<= 30 Menit Sebelum Mulai) ───
      if (user.academicCourses && user.academicCourses.length > 0) {
        for (const course of user.academicCourses) {
          const courseDay = (course.hari || '').trim().toLowerCase();
          const isToday =
            courseDay === wibDayEn ||
            courseDay === wibDayId ||
            (wibDayEn === 'monday' && courseDay === 'senin') ||
            (wibDayEn === 'tuesday' && courseDay === 'selasa') ||
            (wibDayEn === 'wednesday' && courseDay === 'rabu') ||
            (wibDayEn === 'thursday' && courseDay === 'kamis') ||
            (wibDayEn === 'friday' && courseDay === 'jumat') ||
            (wibDayEn === 'saturday' && courseDay === 'sabtu') ||
            (wibDayEn === 'sunday' && courseDay === 'minggu');

          if (!isToday) continue;

          const [hStr, mStr] = (course.jamMulai || '08:00').split(':');
          const classMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
          const diffMinutes = classMinutes - nowMinutes;

          // Kirim pengingat bila tersisa <= 30 menit sebelum mulai
          if (diffMinutes > 0 && diffMinutes <= 30) {
            const key = `course_${course.id}_${wibDateStr}`;
            const alreadySent = await prisma.notificationLog.findUnique({ where: { key } });
            if (!alreadySent) {
              await prisma.notificationLog.create({ data: { key } });
              await notifyServerClassReminder(course, user.telegramChatId, displayName);
              sentCount++;
              sentLogs.push(`Sent class reminder for ${course.mataKuliah} to ${displayName}`);
            }
          }
        }
      }

      // ─── B. Pengingat Tugas & Deadline ───
      if (user.schedules && user.schedules.length > 0) {
        for (const schedule of user.schedules) {
          const parsed = parseScheduleMeta(schedule);
          if (parsed.progress === 100) continue;

          const taskDate = typeof schedule.tanggal === 'string'
            ? schedule.tanggal.split('T')[0]
            : new Date(schedule.tanggal).toISOString().split('T')[0];

          // 1. Deadline Hari Ini
          if (taskDate === wibDateStr) {
            const key = `deadline_${schedule.id}_${wibDateStr}`;
            const alreadySent = await prisma.notificationLog.findUnique({ where: { key } });
            if (!alreadySent) {
              await prisma.notificationLog.create({ data: { key } });
              await notifyServerDeadlineReminder(schedule, user.telegramChatId, displayName);
              sentCount++;
              sentLogs.push(`Sent deadline today for ${schedule.judul} to ${displayName}`);
            }

            // 2. Impending Reminder (Menjelang Deadline Waktu Spesifik)
            if (parsed.reminderBefore) {
              const [hStr, mStr] = parsed.deadlineTime.split(':');
              const deadlineMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
              const diffMinutes = deadlineMinutes - nowMinutes;

              if (diffMinutes > 0 && diffMinutes <= parsed.reminderBefore) {
                const impendingKey = `impending_${schedule.id}_${parsed.reminderBefore}_${wibDateStr}`;
                const alreadySentImpending = await prisma.notificationLog.findUnique({ where: { key: impendingKey } });
                if (!alreadySentImpending) {
                  await prisma.notificationLog.create({ data: { key: impendingKey } });
                  await notifyServerImpendingDeadlineReminder(parsed, parsed.reminderBefore, user.telegramChatId, displayName);
                  sentCount++;
                  sentLogs.push(`Sent impending deadline for ${parsed.cleanTitle} to ${displayName}`);
                }
              }
            }
          }

          // 3. Overdue (Tugas melewati deadline & belum beres)
          if (taskDate < wibDateStr) {
            const overdueKey = `overdue_${schedule.id}_${wibDateStr}`;
            const alreadySentOverdue = await prisma.notificationLog.findUnique({ where: { key: overdueKey } });
            if (!alreadySentOverdue) {
              await prisma.notificationLog.create({ data: { key: overdueKey } });
              await notifyServerOverdueTaskReminder(schedule, user.telegramChatId, displayName);
              sentCount++;
              sentLogs.push(`Sent overdue reminder for ${schedule.judul} to ${displayName}`);
            }
          }
        }
      }
    }

    return res.status(200).json({
      ok: true,
      wibTime: `${wibDateStr} ${wibTimeStr} WIB`,
      usersChecked: users.length,
      notificationsSent: sentCount,
      logs: sentLogs
    });
  } catch (err: any) {
    console.error('Cron reminders error:', err);
    return res.status(500).json({ error: err.message });
  }
}
