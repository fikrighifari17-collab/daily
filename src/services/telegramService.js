// Telegram Notification Service for Daily App
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8921487742:AAHhTul_2PYhlZBxlYmDa9-BtM0q8FVKoTc';
export const BOT_USERNAME = 'Semestara_Bot';
export const BOT_URL = 'https://t.me/Semestara_Bot';

export function getStoredChatId() {
  try {
    const saved = localStorage.getItem('daily_user_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.telegramChatId) return parsed.telegramChatId;
      if (parsed.username) {
        return localStorage.getItem(`telegram_chat_id_${parsed.username}`) || null;
      }
      return null;
    }
  } catch {}
  return null;
}

export function setStoredChatId(chatId) {
  let username = null;
  try {
    const saved = localStorage.getItem('daily_user_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      username = parsed.username;
    }
  } catch {}

  if (chatId && chatId.trim()) {
    const clean = chatId.trim();
    localStorage.setItem('telegram_chat_id', clean);
    if (username) {
      localStorage.setItem(`telegram_chat_id_${username}`, clean);
    }
  } else {
    localStorage.removeItem('telegram_chat_id');
    if (username) {
      localStorage.removeItem(`telegram_chat_id_${username}`);
    }
  }
}

export function isTelegramNotificationEnabled() {
  const val = localStorage.getItem('telegram_notifications_enabled');
  return val === null ? true : val === 'true';
}

export function setTelegramNotificationEnabled(enabled) {
  localStorage.setItem('telegram_notifications_enabled', String(enabled));
}

export function getUserDisplayName() {
  try {
    const saved = localStorage.getItem('daily_user_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.nama || parsed.username || 'demo';
    }
  } catch {
    // fallback
  }
  return 'demo';
}

// In-memory anti-double notification cache: prevent sending identical messages to the same chat within 15 seconds
const recentlySentMessages = new Map();

export function extractCleanTitle(task) {
  if (!task) return 'Tanpa Judul';
  let title = task.cleanTitle || task.judul || 'Tanpa Judul';

  // 1. Remove [Meta:... (case insensitive)
  const metaIdx = title.search(/\[Meta:/i);
  if (metaIdx !== -1) {
    title = title.substring(0, metaIdx).trim();
  }

  // 2. Remove (Mulai: ...)
  title = title.replace(/\(Mulai:\s*[^\)]+\)/gi, '').trim();

  // 3. Remove [Deadline: ...]
  title = title.replace(/\[Deadline:\s*[^\]]+\]/gi, '').trim();

  // 4. Remove trailing leaked braces/brackets
  title = title.replace(/(\s*\}[\}\]\s]*)+$/g, '').trim();

  return title.trim() || 'Tanpa Judul';
}

export function extractDeadlineTime(task) {
  if (task?.deadlineTime) return task.deadlineTime;
  const match = (task?.judul || '').match(/\[Deadline:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : '';
}

export function extractReminderBefore(task) {
  if (task?.reminderBefore) {
    const m = Number(task.reminderBefore);
    return m >= 60 ? `${Math.round(m / 60)} Jam sebelumnya` : `${m} Menit sebelumnya`;
  }
  const metaIdx = (task?.judul || '').lastIndexOf('[Meta:');
  if (metaIdx !== -1) {
    try {
      const after = task.judul.substring(metaIdx + 6);
      const end = after.lastIndexOf(']');
      if (end !== -1) {
        const parsed = JSON.parse(after.substring(0, end));
        if (parsed.reminderBefore) {
          const m = Number(parsed.reminderBefore);
          return m >= 60 ? `${Math.round(m / 60)} Jam sebelumnya` : `${m} Menit sebelumnya`;
        }
      }
    } catch {}
  }
  return '';
}

export async function sendTelegramMessage(htmlText, customChatId = null) {
  const chatId = customChatId || getStoredChatId();
  if (!chatId) {
    return { ok: false, error: 'Chat ID Telegram belum diatur.' };
  }

  // Anti-double protection: if identical message was sent to this chatId within 15 seconds, ignore
  const dedupKey = `${chatId}::${htmlText.trim()}`;
  const now = Date.now();
  const lastSent = recentlySentMessages.get(dedupKey) || 0;
  if (now - lastSent < 15000) {
    console.warn('Blocked duplicate Telegram notification:', dedupKey);
    return { ok: true, skipped: 'duplicate_prevented' };
  }
  recentlySentMessages.set(dedupKey, now);

  // Clean old entries
  if (recentlySentMessages.size > 50) {
    for (const [k, time] of recentlySentMessages.entries()) {
      if (now - time > 60000) recentlySentMessages.delete(k);
    }
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Telegram send failed:', err);
    return { ok: false, error: err.message };
  }
}

export async function notifyNewTask(task, customChatId = null, customUserName = null) {
  if (!isTelegramNotificationEnabled()) return;
  const userName = customUserName || getUserDisplayName();
  const cleanTitle = extractCleanTitle(task);
  const deadlineTime = extractDeadlineTime(task);
  const reminderBefore = extractReminderBefore(task);
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Belum ditentukan';

  const timeSuffix = deadlineTime ? ` (pukul ${deadlineTime} WIB)` : '';
  const reminderRow = reminderBefore ? `\n🔔 <b>Pengingat:</b> ${reminderBefore}` : '';

  const message = `
Halo <b>${userName}</b>, ini Semestara!!! 🚀

📌 <b>TUGAS BARU DITAMBAHKAN</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Judul:</b> ${cleanTitle}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Deadline:</b> ${deadlineStr}${timeSuffix}${reminderRow}

<i>Pemberitahuan otomatis dari Semestara. Semangat menyelesaikannya!</i>
`.trim();

  return await sendTelegramMessage(message, customChatId);
}

export async function notifyTaskCompleted(task, customChatId = null, customUserName = null) {
  if (!isTelegramNotificationEnabled()) return;
  const userName = customUserName || getUserDisplayName();
  const cleanTitle = extractCleanTitle(task);

  const message = `
Halo <b>${userName}</b>, ini Semestara!!! 🎉

⭐ <b>TUGAS BERHASIL DISELESAIKAN!</b>
━━━━━━━━━━━━━━━━━━━━
✅ <b>Judul:</b> ${cleanTitle}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
🏆 <b>Status:</b> 100% Selesai

<i>Hebat! Satu beban akademik berhasil diselesaikan di Semestara. Tetap jaga kesehatan mentalmu!</i>
`.trim();

  return await sendTelegramMessage(message, customChatId);
}

export async function testTelegramConnection(customChatId = null, customUserName = null) {
  const chatId = customChatId || getStoredChatId();
  const userName = customUserName || getUserDisplayName();
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const message = `
Halo <b>${userName}</b>, ini Semestara!!! 👋

🚀 <b>KONEKSI BOT SEMESTARA BERHASIL!</b>
━━━━━━━━━━━━━━━━━━━━
Bot <b>@Semestara_Bot</b> telah resmi terhubung dengan akun <b>Semestara</b> Anda.

🕒 <b>Waktu:</b> ${time} WIB
🔔 <b>Fitur:</b> Notifikasi tugas baru, pengingat deadline kuliah, dan update akademik.

<i>Jika Anda menerima pesan ini, integrasi Telegram siap digunakan!</i>
`.trim();

  return await sendTelegramMessage(message, chatId);
}

export async function notifyClassReminder(course, customChatId = null, customUserName = null) {
  if (!isTelegramNotificationEnabled()) return;
  const userName = customUserName || getUserDisplayName();
  const linkRow = course.link ? `🔗 <b>Link Kelas:</b> ${course.link}\n` : '';

  const message = `
Halo <b>${userName}</b>, ini Semestara!!! ⏰

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

  return await sendTelegramMessage(message, customChatId);
}

export async function notifyDeadlineReminder(task, customChatId = null, customUserName = null) {
  if (!isTelegramNotificationEnabled()) return;
  const userName = customUserName || getUserDisplayName();
  const cleanTitle = extractCleanTitle(task);
  const deadlineTime = extractDeadlineTime(task);
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Hari ini';

  const timeSuffix = deadlineTime ? ` (pukul ${deadlineTime} WIB)` : '';

  const message = `
Halo <b>${userName}</b>, ini Semestara!!! ⚠️

⏰ <b>PENGINGAT DEADLINE TUGAS (HARI INI)</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Tugas:</b> ${cleanTitle}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Batas Akhir:</b> ${deadlineStr}${timeSuffix}
━━━━━━━━━━━━━━━━━━━━
<i>Tugas ini memiliki tenggat waktu hari ini. Yuk cicil dan kumpulkan sebelum deadline berakhir! Semangat ya! 💪🔥</i>
`.trim();

  return await sendTelegramMessage(message, customChatId);
}

export async function notifyOverdueTaskReminder(task, customChatId = null, customUserName = null) {
  if (!isTelegramNotificationEnabled()) return;
  const userName = customUserName || getUserDisplayName();
  const cleanTitle = extractCleanTitle(task);
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Sebelumnya';

  const message = `
Halo <b>${userName}</b>, ini Semestara!!! ⚠️

⏰ <b>PERINGATAN: TUGAS MELEWATI DEADLINE</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Tugas:</b> ${cleanTitle}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Tenggat:</b> ${deadlineStr} (Sudah Lewat)
━━━━━━━━━━━━━━━━━━━━
<i>Tugas ini belum ditandai selesai di Semestara. Segera cek dan selesaikan atau perbarui status tugasmu di aplikasi ya! Jangan biarkan tugasmu makin menumpuk. Tetap fokus! 🔥</i>
`.trim();

  return await sendTelegramMessage(message, customChatId);
}

export async function notifyImpendingDeadlineReminder(task, minutesBefore, customChatId = null, customUserName = null) {
  if (!isTelegramNotificationEnabled()) return;
  const userName = customUserName || getUserDisplayName();
  const sisaWaktuStr = minutesBefore >= 60 ? `${Math.round(minutesBefore / 60)} jam` : `${minutesBefore} menit`;
  const jamDeadline = task.deadlineTime || extractDeadlineTime(task) || '23:59';
  const taskTitle = extractCleanTitle(task);

  const message = `
Halo <b>${userName}</b>, Semestara mau ngingetin nih! ⌛

Tugas "<b>${taskTitle}</b>" (<i>${task.jenis || 'Tugas'}</i>) tenggat waktunya tinggal <b>${sisaWaktuStr}</b> lagi (pukul <b>${jamDeadline}</b> WIB).

Yuk rapikan draft terakhir atau submit tugasmu sekarang biar nggak buru-buru di menit terakhir. Kamu pasti bisa beresin ini! Semangat terus ya! ✨👏
`.trim();

  return await sendTelegramMessage(message, customChatId);
}
