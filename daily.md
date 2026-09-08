# Semestara — Kalender Emosi & Pendamping Akademik Mahasiswa

> *"I hope this makes things a little easier for you."*

Aplikasi self-tracking mood dan pengorganisir jadwal akademik pribadi mahasiswa yang terintegrasi secara privat. Aplikasi ini membantu mahasiswa menjaga keseimbangan kesehatan mental dan performa akademik tanpa pelaporan ke pihak ketiga manapun.

- **URL Deployment Live:** `https://daily-pink-gamma.vercel.app/`
- **Repositori:** `https://github.com/fikrighifari17-collab/daily`
- **Arsitektur:** Full-stack di Vercel (React + Serverless Functions) + Supabase PostgreSQL + Telegram Bot Service

---

## Ringkasan Progres & Fitur yang Telah Diimplementasikan

Berikut adalah daftar lengkap fitur, arsitektur, dan perbaikan yang sudah selesai dibangun sejauh ini:

### 1. Fondasi Backend, Serverless, & Database Supabase
- **Vercel Serverless Functions:** Seluruh route backend aktif di folder `api/` (`/api/auth/*`, `/api/academic-courses`, `/api/schedule`, `/api/mood`, `/api/cron/reminders`, `/api/health`).
- **Shared Helpers Relocation:** Helper backend (`prisma.ts`, `auth.ts`, `telegram.ts`) dipusatkan di root `lib/` dengan import ESM `.js` eksplisit dan konfigurasi `tsconfig.json` tersendiri, mencegah konflik route Vercel.
- **Supabase Transaction Pooler (Port 6543):** Koneksi database PostgreSQL menggunakan Transaction Mode Pooler (`aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`), menyelesaikan problem connection dropped pada serverless Vercel.
- **Node.js 24 Platform Alignment:** Spesifikasi engine `"engines": { "node": "24.x" }` di `package.json` untuk kompatibilitas jangka panjang Vercel.
- **Health Check Monitoring:** Endpoint `/api/health` aktif untuk memverifikasi uptime backend dan konektivitas Supabase secara realtime.

### 2. Autentikasi & Akun Multi-User
- **JWT & Password Security:** Sistem registrasi & login menggunakan hashing `bcryptjs` dan token `jsonwebtoken`.
- **Akun Aktif di Cloud:** Pengguna terdaftar di Supabase (`demo`, `katerine`, `haerin`, `fikritest`).
- **Keamanan Profil:** Penyimpanan Telegram Chat ID per user untuk pengiriman pengingat personal.

### 3. Modul Jadwal Kuliah Mingguan (Academic Schedule)
- **Data Matkul Lengkap:** Menyimpan nama mata kuliah, nama dosen, hari, jam mulai/selesai, ruangan, bobot SKS, kode warna visual, link kelas (Zoom/GMeet/LMS), presensi, dan materi kuliah.
- **Live Class Indicator:** Status kelas realtime yang terupdate otomatis:
  - `LAGI KULIAH • Sisa X menit` (saat jam kuliah berlangsung).
  - `Mulai X menit lagi` (ketika kelas akan dimulai dalam waktu dekat).
  - `Kuliah Sudah Selesai` (setelah jam selesai).
- **Manajemen Presensi 16 Pertemuan:**
  - Tracking kehadiran per sesi (Hadir, Izin, Alpa, Pending) dengan alasan izin opsional.
  - Perhitungan persentase kehadiran semester dan deteksi dini jika kehadiran di bawah 75%.
  - Tombol aksi cepat *"Tandai Semua Hadir"*.
- **Manajemen Materi & PPT Dosen:**
  - Penyimpanan file materi (PDF, PPT, Word) dan tautan eksternal per pertemuan (Pertemuan 1–16).
  - Fitur filter materi per nomor pertemuan dan per tipe file, serta tombol download langsung.
- **Ekspor Kalender:** Integrasi ekspor ke format `.ics` untuk sinkronisasi ke Google Calendar, Outlook, atau Apple Calendar.

### 4. Modul Tugas & Deadline Akademik (Schedule / Tasks)
- **Pencatatan Tugas:** Kategori tugas, UTS, UAS, kuis, presentasi, dan kegiatan belajar.
- **Kalkulasi Tenggat:** Penghitungan sisa hari, indikator prioritas tinggi/sedang/rendah, dan filter status (Belum Selesai vs Selesai).
- **Attachment Storage Terisolasi:** Penyimpanan lampiran file/dokumen tugas menggunakan IndexedDB browser yang aman dan hemat kuota transfer cloud.

### 5. Modul Kalender Emosi & Check-in Mood Harian
- **Check-in Mood Komprehensif:** Pilihan skor emosi (1-5), waktu pencatatan (pagi, siang, sore, malam), catatan refleksi, rekaman audio voice note, dan lampiran foto.
- **Tag Pemicu Emosi:** Pengelompokan pemicu emosi (Akademik, Tugas, Teman, Keluarga, Finansial, Tidur, dll.).
- **Visualisasi Kalender Emosi:** Kalender visual berwarna untuk melihat tren fluktuasi emosi bulanan yang dikorelasikan dengan hari-hari sibuk perkuliahan.
- **Coping Strategies & Brain Dump:** Kotak pencatatan cepat pembuang beban pikiran dan kumpulan strategi menenangkan diri.

### 6. Notifikasi Telegram Bot Terintegrasi (@SemestaraBot)
- **Tugas Baru & Tugas Selesai:** Bot otomatis mengirim pesan konfirmasi ke Telegram pengguna saat tugas baru ditambahkan atau diselesaikan.
- **Pengingat Kelas (30 Menit Sebelum Mulai):** Deteksi otomatis jadwal kuliah hari ini yang mengirim pengingat ke Telegram 30 menit sebelum kelas dimulai.
- **Vercel Cron Reminder (`/api/cron/reminders`):**
  - Pengingat otomatis untuk tugas yang mendekati deadline (tenggat dalam 24 jam).
  - Pengingat tugas yang terlewat (overdue) agar mahasiswa tidak ketinggalan pengumpulan.

### 7. Sinkronisasi Real-Time Multi-Perangkat (HP & Laptop)
- **Auto-Sync Lintas Perangkat:**
  - `window.focus` & `visibilitychange`: Laptop otomatis menyinkronkan data terbaru dari Supabase begitu jendela atau tab dibuka.
  - Polling latar belakang berkala setiap 15 detik agar perubahan yang dimasukkan dari HP otomatis tampil di laptop tanpa refresh manual.
- **Tombol "Sinkron" Manual:** Tombol 1-klik di toolbar filter Jadwal Kuliah untuk memicu sinkronisasi instan kapan saja.
- **Normalisasi Nama Hari (`normalizeDay`):** Penyeragaman format hari bahasa Indonesia (`Senin`, `Rabu`) dan bahasa Inggris (`Monday`, `Wednesday`) sehingga data tidak pernah hilang pada filter tab hari.
- **Header Anti-Cache Realtime:** Penerapan header `Cache-Control: no-store, no-cache` di backend dan parameter query unik `?_t=...` di frontend untuk mencegah cache usang browser.
- **Desain Responsif & Perbaikan Mobile Menu Drawer:** Penataan ulang stacking context `z-index` (drawer `110`, backdrop `105`) memastikan menu burger di layar HP berfungsi lancar dan tidak membeku.

---

## Tech Stack Saat Ini

| Layer | Teknologi |
|---|---|
| **Frontend** | React (Vite), React Router, Lucide Icons, Canvas Confetti |
| **Styling** | Vanilla CSS Glassmorphism kustom (Teal/Dark Mode Palette) |
| **Backend** | Vercel Serverless Functions (Node.js 24, TypeScript, folder `/api`) |
| **Database** | PostgreSQL di Supabase (via Transaction Pooler port 6543) |
| **ORM** | Prisma Client (v6.19.3) |
| **Autentikasi** | JWT (`jsonwebtoken`) + enkripsi `bcryptjs` |
| **Notifikasi** | Telegram Bot API (`node-fetch`) + Vercel Cron Jobs |
| **Hosting & CI/CD** | Vercel (Auto-deploy dari branch `main` GitHub) |

---

## Struktur Folder Proyek

```
daily/
├── api/                          # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.ts              # Login & pengembalian JWT
│   │   ├── register.ts           # Registrasi akun baru
│   │   └── me.ts                 # Update profil & Telegram Chat ID
│   ├── academic-courses.ts       # CRUD Jadwal Kuliah, presensi, dan materi
│   ├── schedule.ts               # CRUD Tugas & Deadline akademik
│   ├── mood.ts                   # CRUD Riwayat & Check-in Mood
│   ├── health.ts                 # Healthcheck koneksi Supabase & backend
│   └── cron/
│       └── reminders.ts          # Cron pengingat deadline & overdue Telegram
│
├── lib/                          # Shared Serverless Modules (bukan route Vercel)
│   ├── prisma.ts                 # Prisma Client singleton
│   ├── auth.ts                   # Middleware verifikasi JWT
│   └── telegram.ts               # Telegram notification engine
│
├── prisma/
│   └── schema.prisma             # Skema model Supabase PostgreSQL
│
├── src/                          # Frontend Application (React)
│   ├── components/
│   │   ├── Navbar.jsx            # Header & responsive mobile drawer navigation
│   │   ├── SemestaraLogo.jsx     # Komponen logo Semestara SVG modern
│   │   ├── CalendarOverlay.jsx   # Modal overlay kalender
│   │   ├── PinLock.jsx           # Fitur kunci PIN lokal
│   │   └── MoodCheckin.jsx       # Form input emosi & mood harian
│   ├── context/
│   │   ├── AuthContext.jsx       # State session user & token
│   │   ├── DataContext.jsx       # State data global & listener auto-sync 15s
│   │   └── ToastContext.jsx      # Notifikasi pop-up toast
│   ├── pages/
│   │   ├── Dashboard.jsx         # Ringkasan mood harian & kelas hari ini
│   │   ├── AcademicSchedulePage.jsx # Jadwal kuliah, presensi, materi, & tombol sync
│   │   ├── SchedulePage.jsx      # Tugas & deadline, lampiran, filter prioritas
│   │   ├── CheckinPage.jsx       # Riwayat & analitik emosi
│   │   ├── SettingsPage.jsx      # Profil, set Telegram ID, export data, tema
│   │   └── LoginPage.jsx         # Halaman masuk & registrasi
│   ├── services/
│   │   ├── api.js                # Client API calls dengan anti-cache headers
│   │   └── telegramService.js    # Client-side trigger notifikasi Telegram
│   ├── utils/
│   │   ├── scheduleUtils.js      # Serializer & parser data tugas
│   │   ├── calendarExport.js     # Generator file .ics
│   │   └── attachmentStorage.js  # Penyimpanan file IndexedDB lokal
│   ├── App.jsx                   # Routing aplikasi
│   └── main.jsx                  # Entry point
│
├── tsconfig.json                 # Konfigurasi TypeScript untuk serverless api/
├── vercel.json                   # Konfigurasi rewrite & Vercel Cron schedule
├── package.json                  # Dependencies & script build (prisma generate + vite build)
└── .env                          # Variabel lingkungan lokal (DATABASE_URL port 6543)
```

---

## Skema Database Terpasang (Supabase PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             Int       @id @default(autoincrement())
  username       String    @unique
  nama           String
  email          String?   @unique
  password       String
  pinLock        String?
  telegramChatId String?
  createdAt      DateTime  @default(now())

  moodEntries     MoodEntry[]
  schedules       Schedule[]
  academicCourses AcademicCourse[]
  tags            Tag[]
  copingStrategies CopingStrategy[]
  brainDumps      BrainDump[]
}

model AcademicCourse {
  id          Int      @id @default(autoincrement())
  userId      Int
  mataKuliah  String
  dosen       String   @default("Dosen Pengampu")
  hari        String   @default("Monday")
  jamMulai    String   @default("08:00")
  jamSelesai  String   @default("10:00")
  ruangan     String   @default("Ruang Kuliah")
  sks         Int      @default(3)
  warna       String   @default("#00ADB5")
  link        String   @default("")
  attendance  Json?    // Sesi 1-16, status hadir/izin/alpa, materi & file PPT
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Schedule {
  id        Int      @id @default(autoincrement())
  userId    Int
  judul     String
  jenis     String   // tugas, uts, uas, presentasi, belajar
  tanggal   DateTime @db.Date

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model MoodEntry {
  id            Int      @id @default(autoincrement())
  userId        Int
  moodScore     Int      // skala 1-5
  catatan       String?
  voiceNotePath String?
  photoUrl      String?
  waktu         String   @default("08:00 AM")
  tanggal       DateTime @db.Date
  createdAt     DateTime @default(now())

  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags MoodTag[]
}

model Tag {
  id     Int    @id @default(autoincrement())
  userId Int
  nama   String

  user  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  moods MoodTag[]
}

model MoodTag {
  moodId Int
  tagId  Int

  mood MoodEntry @relation(fields: [moodId], references: [id], onDelete: Cascade)
  tag  Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([moodId, tagId])
}

model CopingStrategy {
  id           Int     @id @default(autoincrement())
  userId       Int
  namaStrategi String
  deskripsi    String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model BrainDump {
  id        Int      @id @default(autoincrement())
  userId    Int
  isi       String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Daftar Endpoint API Vercel

| Endpoint | Method | Deskripsi & Fungsi |
|---|---|---|
| `/api/health` | GET | Cek status serverless backend & koneksi Supabase |
| `/api/auth/register` | POST | Pendaftaran user baru (enkripsi bcrypt) |
| `/api/auth/login` | POST | Login user, mengembalikan token JWT |
| `/api/auth/me` | GET / PUT | Ambil profil & simpan Telegram Chat ID |
| `/api/academic-courses` | GET / POST | Ambil seluruh jadwal kuliah user / tambah matkul baru / upload bulk |
| `/api/academic-courses?id=:id` | PUT / DELETE | Update detail matkul, presensi, materi PPT / hapus matkul |
| `/api/schedule` | GET / POST | Ambil daftar tugas & deadline / tambah tugas baru |
| `/api/schedule?id=:id` | PUT / DELETE | Update status selesai tugas / hapus tugas |
| `/api/mood` | GET / POST | Ambil riwayat mood / simpan check-in emosi |
| `/api/cron/reminders` | GET | Cron job otomatis untuk pengingat deadline <24 jam & overdue |

---

## Prinsip Keamanan & Privasi

1. **Privasi Absolut:** Data bersifat pribadi mahasiswa, tidak terhubung dan tidak dilaporkan ke sistem kampus.
2. **Validasi JWT Ketat:** Setiap operasi data mewajibkan verifikasi token JWT valid yang terikat langsung ke `userId`.
3. **Database Cloud Terisolasi:** Menggunakan Supabase dengan otentikasi role aman dan parameter koneksi terkontrol.
4. **Isolasi File Lampiran Tugas:** Dokumen/file tugas disimpan secara lokal pada IndexedDB perangkat pengguna untuk menjaga kerahasiaan dan privasi dokumen akademik.