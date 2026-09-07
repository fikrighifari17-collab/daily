// Telegram Notification Service for Daily App
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8921487742:AAHhTul_2PYhlZBxlYmDa9-BtM0q8FVKoTc';
const DEFAULT_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '8025609014';
export const BOT_USERNAME = 'Semestara_Bot';
export const BOT_URL = 'https://t.me/Semestara_Bot';

export function getStoredChatId() {
  return localStorage.getItem('telegram_chat_id') || DEFAULT_CHAT_ID;
}

export function setStoredChatId(chatId) {
  if (chatId) {
    localStorage.setItem('telegram_chat_id', chatId.trim());
  } else {
    localStorage.removeItem('telegram_chat_id');
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

export async function sendTelegramMessage(htmlText, customChatId = null) {
  const chatId = customChatId || getStoredChatId();
  if (!chatId) {
    return { ok: false, error: 'Chat ID Telegram belum diatur.' };
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
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Belum ditentukan';

  const message = `
Halo <b>${userName}</b>, ini Semestara!!! 🚀

📌 <b>TUGAS BARU DITAMBAHKAN</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Judul:</b> ${task.judul || 'Tanpa Judul'}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Deadline:</b> ${deadlineStr}

<i>Pemberitahuan otomatis dari Semestara. Semangat menyelesaikannya!</i>
`.trim();

  return await sendTelegramMessage(message, customChatId);
}

export async function notifyTaskCompleted(task, customChatId = null, customUserName = null) {
  if (!isTelegramNotificationEnabled()) return;
  const userName = customUserName || getUserDisplayName();
  const message = `
Halo <b>${userName}</b>, ini Semestara!!! 🎉

⭐ <b>TUGAS BERHASIL DISELESAIKAN!</b>
━━━━━━━━━━━━━━━━━━━━
✅ <b>Judul:</b> ${task.judul || 'Tanpa Judul'}
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
  const deadlineStr = task.tanggal ? new Date(task.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Hari ini';

  const message = `
Halo <b>${userName}</b>, ini Semestara!!! ⚠️

⏰ <b>PENGINGAT DEADLINE TUGAS (HARI INI)</b>
━━━━━━━━━━━━━━━━━━━━
📝 <b>Tugas:</b> ${task.judul || 'Tanpa Judul'}
📂 <b>Kategori:</b> ${task.jenis || 'Tugas'}
📅 <b>Batas Akhir:</b> ${deadlineStr}
━━━━━━━━━━━━━━━━━━━━
<i>Tugas ini memiliki tenggat waktu hari ini. Yuk cicil dan kumpulkan sebelum deadline berakhir! Semangat ya! 💪🔥</i>
`.trim();

  return await sendTelegramMessage(message, customChatId);
}
