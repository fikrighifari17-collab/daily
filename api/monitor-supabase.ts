import prisma from '../lib/prisma.js';

const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_MONITOR_BOT_TOKEN || '8740741459:AAGLRnx3a9OeV2EfsJHtqliqB0vXDBVP8Pw';
const DEFAULT_CHAT_ID = process.env.TELEGRAM_MONITOR_CHAT_ID || '8025609014';
const SUPABASE_FREE_TIER_MAX_BYTES = 500 * 1024 * 1024; // 500 MB limit

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    // 1. Query Database Size from PostgreSQL
    let dbSizeBytes = 0;
    let dbSizeReadable = '0 MB';

    try {
      const dbSizeRaw: any[] = await prisma.$queryRaw`
        SELECT pg_database_size(current_database())::text AS bytes,
               pg_size_pretty(pg_database_size(current_database())) AS readable_size
      `;
      if (dbSizeRaw && dbSizeRaw.length > 0) {
        dbSizeBytes = Number(dbSizeRaw[0].bytes) || 0;
        dbSizeReadable = dbSizeRaw[0].readable_size || '0 MB';
      }
    } catch (sizeErr) {
      console.warn('Could not query pg_database_size:', sizeErr);
    }

    // 2. Query Top 5 Largest Tables by Storage
    let topTables: any[] = [];
    try {
      const tablesRaw: any[] = await prisma.$queryRaw`
        SELECT relname AS table_name,
               pg_size_pretty(pg_total_relation_size(relid)) AS size
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 5
      `;
      if (Array.isArray(tablesRaw)) {
        topTables = tablesRaw;
      }
    } catch (tblErr) {
      console.warn('Could not query table sizes:', tblErr);
    }

    // 3. Query Table Counts
    const [userCount, courseCount, scheduleCount, moodCount, dumpCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.academicCourse.count().catch(() => 0),
      prisma.schedule.count().catch(() => 0),
      prisma.moodEntry.count().catch(() => 0),
      prisma.brainDump.count().catch(() => 0)
    ]);

    // 4. Calculate Percentage & Health Status
    const usagePercent = Number(((dbSizeBytes / SUPABASE_FREE_TIER_MAX_BYTES) * 100).toFixed(2));
    let statusText = '🟢 SANGAT AMAN';
    let statusEmoji = '🟢';

    if (usagePercent >= 80) {
      statusText = '🔴 KRITIS (Mendekati Kuota 500 MB!)';
      statusEmoji = '🔴';
    } else if (usagePercent >= 60) {
      statusText = '🟡 PERHATIAN (> 60%)';
      statusEmoji = '🟡';
    }

    // Format Current Time in WIB (UTC+7)
    const nowWib = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    // 5. Compose Telegram HTML Message
    const topTablesList = topTables.length > 0
      ? topTables.map(t => `  • <code>${t.table_name}</code>: <b>${t.size}</b>`).join('\n')
      : '  • <i>Data tabel belum tersedia</i>';

    const message = `
${statusEmoji} <b>LAPORAN KAPASITAS SUPABASE</b>
━━━━━━━━━━━━━━━━━━━━
💾 <b>Ukuran Database:</b> ${dbSizeReadable} / 500 MB (<b>${usagePercent}%</b>)
📊 <b>Status Kuota:</b> ${statusText}

📁 <b>5 Tabel Terbesar (Storage):</b>
${topTablesList}

👥 <b>Jumlah Data Terdata:</b>
  • Pengguna: <b>${userCount}</b>
  • Jadwal Kuliah: <b>${courseCount}</b>
  • Tugas / Agenda: <b>${scheduleCount}</b>
  • Check-in Mood: <b>${moodCount}</b>
  • Brain Dump: <b>${dumpCount}</b>
━━━━━━━━━━━━━━━━━━━━
⏰ <i>Waktu Pengecekan: ${nowWib} WIB</i>
<i>Sistem Monitoring Otomatis Semestara</i>
`.trim();

    // 6. Send to Telegram
    const botToken = req.query?.bot_token || DEFAULT_BOT_TOKEN;
    const chatId = req.query?.chat_id || DEFAULT_CHAT_ID;

    let telegramResult: any = null;
    let telegramError: string | null = null;

    if (botToken && chatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          })
        });
        telegramResult = await tgRes.json();
        if (!telegramResult?.ok) {
          telegramError = telegramResult?.description || 'Gagal mengirim pesan Telegram';
        }
      } catch (tgErr: any) {
        telegramError = tgErr.message || String(tgErr);
      }
    }

    return res.status(200).json({
      status: 'ok',
      database: {
        sizeBytes: dbSizeBytes,
        sizeReadable: dbSizeReadable,
        maxBytes: SUPABASE_FREE_TIER_MAX_BYTES,
        usagePercent,
        health: statusText
      },
      counts: {
        userCount,
        courseCount,
        scheduleCount,
        moodCount,
        dumpCount
      },
      topTables,
      telegram: {
        sent: !!telegramResult?.ok,
        chatId,
        details: telegramResult,
        error: telegramError
      },
      checkedAt: nowWib
    });
  } catch (err: any) {
    console.error('Monitoring failed:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal melakukan monitoring database',
      error: err?.message || String(err)
    });
  }
}
