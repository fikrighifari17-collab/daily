import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8921487742:AAHhTul_2PYhlZBxlYmDa9-BtM0q8FVKoTc';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: SUPABASE_URL
    }
  }
});

async function sendServerTelegramMessage(text, chatId) {
  if (!chatId) return { ok: false, error: 'No chat ID' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function runCronJob() {
  console.log('--- Menjalankan Simulasi Cron Pengingat Server Semestara ---');
  const now = new Date();
  const wibDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
  const wibDayEn = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(now).toLowerCase();
  const wibDayId = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(now).toLowerCase();
  const wibTimeStr = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(now);
  const [nowH, nowM] = wibTimeStr.split(':').map(Number);
  const nowMinutes = nowH * 60 + nowM;

  console.log(`Waktu Sekarang (WIB): ${wibDateStr} ${wibTimeStr} (${wibDayId.toUpperCase()})`);

  const users = await prisma.user.findMany({
    where: { telegramChatId: { not: null } },
    include: { academicCourses: true, schedules: true }
  });

  console.log(`Ditemukan ${users.length} user dengan Chat ID Telegram.`);

  let sentCount = 0;

  for (const user of users) {
    const displayName = user.nama || user.username || 'Sobat Semestara';
    console.log(`\nUser: ${user.username} | Chat ID: ${user.telegramChatId}`);

    // A. Kuliah
    if (user.academicCourses?.length > 0) {
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

        if (!isToday) {
          console.log(`  - Kelas: ${course.mataKuliah} (${course.hari}) [Bukan hari ini, skip]`);
          continue;
        }

        const [hStr, mStr] = (course.jamMulai || '08:00').split(':');
        const classMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
        const diffMinutes = classMinutes - nowMinutes;

        console.log(`  - Kelas: ${course.mataKuliah} (${course.jamMulai}) -> Sisa waktu: ${diffMinutes} menit`);

        if (diffMinutes > 0 && diffMinutes <= 30) {
          const key = `course_${course.id}_${wibDateStr}`;
          const alreadySent = await prisma.notificationLog.findUnique({ where: { key } });
          if (!alreadySent) {
            await prisma.notificationLog.create({ data: { key } });
            const msg = `Halo <b>${displayName}</b>, ini Semestara!!! ⏰\n\n🔔 <b>PENGINGAT KELAS KULIAH (30 MENIT LAGI)</b>\n━━━━━━━━━━━━━━━━━━━━\n📚 <b>Mata Kuliah:</b> ${course.mataKuliah}\n👨‍🏫 <b>Dosen:</b> ${course.dosen || '-'}\n⏰ <b>Waktu Mulai:</b> ${course.jamMulai} WIB\n📍 <b>Ruangan:</b> ${course.ruangan || '-'}\n🎯 <b>Bobot:</b> ${course.sks || 3} SKS\n━━━━━━━━━━━━━━━━━━━━\n<i>Kelasmu akan segera dimulai. Siapkan catatan & jangan lupa isi absensi ya!</i>`;
            const res = await sendServerTelegramMessage(msg, user.telegramChatId);
            console.log(`    -> Mengirim pengingat kelas ${course.mataKuliah}! Hasil:`, res.ok ? 'Sukses' : res);
            sentCount++;
          } else {
            console.log(`    -> Sudah pernah dikirim hari ini (${key})`);
          }
        }
      }
    }
  }

  console.log(`\nSelesai. Total notifikasi terkirim: ${sentCount}`);
  await prisma.$disconnect();
}

runCronJob().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
