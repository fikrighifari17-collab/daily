const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8921487742:AAHhTul_2PYhlZBxlYmDa9-BtM0q8FVKoTc';

const recentlySentServerMessages = new Map<string, number>();

function extractServerCleanTaskInfo(task: any) {
  let title = task?.judul || 'Tanpa Judul';
  let deadlineTime = '';
  let reminderBefore = '';

  const metaIdx = title.lastIndexOf('[Meta:');
  if (metaIdx !== -1) {
    const after = title.substring(metaIdx + 6);
    const end = after.lastIndexOf(']');
    if (end !== -1) {
      try {
        const parsed = JSON.parse(after.substring(0, end));
        if (parsed.reminderBefore) {
          const m = Number(parsed.reminderBefore);
          reminderBefore = m >= 60 ? `${Math.round(m / 60)} Jam sebelumnya` : `${m} Menit sebelumnya`;
        }
      } catch {}
    }
    title = title.substring(0, metaIdx).trim();
  }

  title = title.replace(/\(Mulai:\s*[^\)]+\)/i, '').trim();

  const deadlineMatch = title.match(/\[Deadline:\s*([^\]]+)\]/i);
  if (deadlineMatch) {
    deadlineTime = deadlineMatch[1].trim();
    title = title.replace(deadlineMatch[0], '').trim();
  }

  title = title.replace(/(\s*\}[\}\]\s]*)+$/g, '').trim();

  return { cleanTitle: title || 'Tanpa Judul', deadlineTime, reminderBefore };
}

export async function sendServerTelegramMessage(text: string, customChatId?: string | null) {
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || null;
  if (!chatId || !BOT_TOKEN) return { ok: false, error: 'Missing token or chatId' };

  // Anti-double protection
  const dedupKey = `${chatId}::${text.trim()}`;
  const now = Date.now();
  const lastSent = recentlySentServerMessages.get(dedupKey) || 0;
  if (now - lastSent < 15000) {
    console.warn('Blocked duplicate server Telegram notification');
    return { ok: true, skipped: 'duplicate_prevented' };
  }
  recentlySentServerMessages.set(dedupKey, now);

  if (recentlySentServerMessages.size > 50) {
    for (const [k, time] of recentlySentServerMessages.entries()) {
      if (now - time > 60000) recentlySentServerMessages.delete(k);
    }
  }

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
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('Server telegram send failed:', err.message);
    return { ok: false, error: err.message };
  }
}

export async function notifyServerNewTask(task: any, customChatId?: string | null, userName?: string | null) {
  const greetingName = userName || 'Sobat Semestara';
  const { cleanTitle, deadlineTime, reminderBefore } = extractServerCleanTaskInfo(task);
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Belum ditentukan';

  const timeSuffix = deadlineTime ? ` (pukul ${deadlineTime} WIB)` : '';
  const reminderRow = reminderBefore ? `\n🔔 <b>Pengingat:</b> ${reminderBefore}` : '';

  const message = `
Halo <b>${greetingName}</b>, ini Semestara!!! 🚀

📌 <b>TUGAS BARU DITAMBAHKAN</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Judul:</b> ${cleanTitle}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Deadline:</b> ${deadlineStr}${timeSuffix}${reminderRow}

<i>Pemberitahuan otomatis dari Semestara. Semangat menyelesaikannya!</i>
`.trim();

  return await sendServerTelegramMessage(message, customChatId);
}

export async function notifyServerClassReminder(course: any, customChatId?: string | null, userName?: string | null) {
  const greetingName = userName || 'Sobat Semestara';
  const linkRow = course.link ? `🔗 <b>Link Kelas:</b> ${course.link}\n` : '';

  const message = `
Halo <b>${greetingName}</b>, ini Semestara!!! ⏰

🔔 <b>PENGINGAT KELAS KULIAH (30 MENIT LAGI)</b>
━━━━━━━━━━━━━━━━━━━━
📚 <b>Mata Kuliah:</b> ${course.mataKuliah || 'Kuliah'}
👨‍🏫 <b>Dosen:</b> ${course.dosen || '-'}
⏰ <b>Waktu Mulai:</b> ${course.jamMulai || '10:00'} WIB (Selesai: ${course.jamSelesai || '12:00'} WIB)
📍 <b>Ruangan:</b> ${course.ruangan || '-'}
🎯 <b>Bobot:</b> ${course.sks || 3} SKS
${linkRow}━━━━━━━━━━━━━━━━━━━━
<i>Kelasmu akan dimulai dalam 30 menit (pukul ${course.jamMulai || '10:00'} WIB). Siapkan catatan, materi perkuliahan, dan jangan lupa isi absensi ya! Semangat belajarnya! 🎓✨</i>
`.trim();

  return await sendServerTelegramMessage(message, customChatId);
}

export async function notifyServerDeadlineReminder(task: any, customChatId?: string | null, userName?: string | null) {
  const greetingName = userName || 'Sobat Semestara';
  const { cleanTitle, deadlineTime } = extractServerCleanTaskInfo(task);
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Hari ini';

  const timeSuffix = deadlineTime ? ` (pukul ${deadlineTime} WIB)` : '';

  const message = `
Halo <b>${greetingName}</b>, ini Semestara!!! ⚠️

⏰ <b>PENGINGAT DEADLINE TUGAS (HARI INI)</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Tugas:</b> ${cleanTitle}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Batas Akhir:</b> ${deadlineStr}${timeSuffix}
━━━━━━━━━━━━━━━━━━━━
<i>Tugas ini memiliki tenggat waktu hari ini. Yuk cicil dan kumpulkan sebelum deadline berakhir! Semangat ya! 💪🔥</i>
`.trim();

  return await sendServerTelegramMessage(message, customChatId);
}

export async function notifyServerOverdueTaskReminder(task: any, customChatId?: string | null, userName?: string | null) {
  const greetingName = userName || 'Sobat Semestara';
  const { cleanTitle } = extractServerCleanTaskInfo(task);
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Sebelumnya';

  const message = `
Halo <b>${greetingName}</b>, ini Semestara!!! ⚠️

⏰ <b>PERINGATAN: TUGAS MELEWATI DEADLINE</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Tugas:</b> ${cleanTitle}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Tenggat:</b> ${deadlineStr} (Sudah Lewat)
━━━━━━━━━━━━━━━━━━━━
<i>Tugas ini belum ditandai selesai di Semestara. Segera cek dan selesaikan atau perbarui status tugasmu di aplikasi ya! Jangan biarkan tugasmu makin menumpuk. Tetap fokus! 🔥</i>
`.trim();

  return await sendServerTelegramMessage(message, customChatId);
}

export async function notifyServerImpendingDeadlineReminder(
  task: any,
  minutesBefore: number,
  customChatId?: string | null,
  userName?: string | null
) {
  const greetingName = userName || 'Sobat Semestara';
  const sisaWaktuStr = minutesBefore >= 60 ? `${Math.round(minutesBefore / 60)} jam` : `${minutesBefore} menit`;
  const jamDeadline = task.deadlineTime || '23:59';
  const taskTitle = task.cleanTitle || task.judul || 'Tanpa Judul';

  const message = `
Halo <b>${greetingName}</b>, Semestara mau ngingetin nih! ⌛

Tugas "<b>${taskTitle}</b>" (<i>${task.jenis || 'Tugas'}</i>) tenggat waktunya tinggal <b>${sisaWaktuStr}</b> lagi (pukul <b>${jamDeadline}</b> WIB).

Yuk rapikan draft terakhir atau submit tugasmu sekarang biar nggak buru-buru di menit terakhir. Kamu pasti bisa beresin ini! Semangat terus ya! ✨👏
`.trim();

  return await sendServerTelegramMessage(message, customChatId);
}

