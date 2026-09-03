# Kalender Emosi Pribadi

Aplikasi self-tracking mood untuk mahasiswa, dikorelasikan dengan jadwal akademik pribadi. Seluruh data bersifat privat milik pengguna — tidak ada fitur pelaporan ke pihak kampus atau institusi manapun.

**Versi ini: Full-stack di Vercel** (React + Vercel Serverless Functions + Vercel Postgres), tanpa perlu XAMPP atau server terpisah.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React (Vite), React Router, Recharts |
| Backend | Vercel Serverless Functions (Node.js/TypeScript, folder `/api`) |
| Database | Vercel Postgres (didukung oleh Neon) |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Styling | Tailwind CSS |
| Hosting | Vercel (frontend + backend + database, satu platform) |

---

## Struktur Folder Proyek (Monorepo Vercel)

```
kalender-emosi/
├── api/                          # Serverless Functions (auto-detect oleh Vercel)
│   ├── auth/
│   │   ├── register.ts
│   │   └── login.ts
│   ├── mood/
│   │   ├── index.ts              # GET (list) & POST (create)
│   │   └── [id].ts               # PUT & DELETE by id
│   ├── schedule/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── tags/
│   │   └── index.ts
│   ├── coping/
│   │   └── index.ts
│   ├── braindump/
│   │   └── index.ts
│   ├── insight/
│   │   └── analytics.ts
│   └── _lib/
│       ├── prisma.ts             # Prisma client singleton
│       └── auth-middleware.ts    # Verifikasi JWT
│
├── prisma/
│   └── schema.prisma
│
├── src/                           # Frontend React
│   ├── components/
│   │   ├── MoodCheckin.jsx
│   │   ├── MoodChart.jsx
│   │   ├── CalendarOverlay.jsx
│   │   ├── TagManager.jsx
│   │   ├── BrainDump.jsx
│   │   ├── CopingLibrary.jsx
│   │   └── PinLock.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── CheckinPage.jsx
│   │   ├── InsightPage.jsx
│   │   ├── SchedulePage.jsx
│   │   └── SettingsPage.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .env.local                     # DATABASE_URL, JWT_SECRET (jangan di-commit)
```

---

## Skema Database (Prisma — PostgreSQL)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          Int       @id @default(autoincrement())
  nama        String
  email       String    @unique
  password    String
  pinLock     String?
  createdAt   DateTime  @default(now())

  moodEntries      MoodEntry[]
  schedules        Schedule[]
  tags             Tag[]
  copingStrategies CopingStrategy[]
  brainDumps       BrainDump[]
}

model MoodEntry {
  id            Int       @id @default(autoincrement())
  userId        Int
  moodScore     Int       // skala 1-5
  catatan       String?
  voiceNotePath String?
  waktu         String    // "pagi" | "siang" | "malam"
  tanggal       DateTime  @db.Date
  createdAt     DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
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

model Schedule {
  id      Int      @id @default(autoincrement())
  userId  Int
  judul   String
  jenis   String   // "tugas" | "uts" | "uas" | "presentasi" | "lainnya"
  tanggal DateTime @db.Date

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model CopingStrategy {
  id            Int     @id @default(autoincrement())
  userId        Int
  namaStrategi  String
  deskripsi     String?

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

## Contoh Serverless Function (api/mood/index.ts)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { verifyToken } from '../_lib/auth-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') {
    const { moodScore, catatan, waktu, tanggal, tagIds } = req.body;
    const entry = await prisma.moodEntry.create({
      data: {
        userId,
        moodScore,
        catatan,
        waktu,
        tanggal: new Date(tanggal),
        tags: { create: (tagIds || []).map((tagId: number) => ({ tagId })) },
      },
    });
    return res.status(201).json(entry);
  }

  if (req.method === 'GET') {
    const { range = 'month' } = req.query;
    const entries = await prisma.moodEntry.findMany({
      where: { userId },
      include: { tags: { include: { tag: true } } },
      orderBy: { tanggal: 'desc' },
    });
    return res.status(200).json(entries);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

## Prisma Client Singleton (api/_lib/prisma.ts)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Middleware Verifikasi JWT (api/_lib/auth-middleware.ts)

```typescript
import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

export function verifyToken(req: VercelRequest): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}
```

---

## Daftar Endpoint API

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/auth/register` | POST | Registrasi user baru |
| `/api/auth/login` | POST | Login, mengembalikan JWT |
| `/api/mood` | GET/POST | List mood / tambah mood baru |
| `/api/mood/[id]` | PUT/DELETE | Update / hapus entri mood |
| `/api/schedule` | GET/POST | List / tambah jadwal akademik pribadi |
| `/api/schedule/[id]` | DELETE | Hapus jadwal |
| `/api/tags` | GET/POST | Kelola tag pemicu custom |
| `/api/coping` | GET/POST | Kelola strategi coping personal |
| `/api/braindump` | GET/POST | Simpan/ambil catatan brain dump |
| `/api/insight/analytics` | GET | Tren mood, korelasi jadwal, skor beban mingguan |

---

## Pemanggilan API dari React (src/services/api.js)

```javascript
const BASE_URL = "/api"; // relatif, karena frontend & backend satu domain di Vercel

function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export async function submitMood(data) {
  const res = await fetch(`${BASE_URL}/mood`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMoodHistory(range = "month") {
  const res = await fetch(`${BASE_URL}/mood?range=${range}`, {
    headers: authHeader(),
  });
  return res.json();
}
```

---

## Konfigurasi vercel.json

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

---

## Environment Variables (diisi di Vercel Dashboard → Settings → Environment Variables)

```
DATABASE_URL=      # otomatis terisi kalau pakai Vercel Postgres integration
JWT_SECRET=        # string acak yang panjang & rahasia
```

---

## Langkah Deploy ke Vercel

1. **Inisialisasi project**
   ```bash
   npm create vite@latest kalender-emosi -- --template react
   cd kalender-emosi
   npm install @vercel/node @prisma/client prisma jsonwebtoken bcrypt
   ```

2. **Setup Prisma & database**
   ```bash
   npx prisma init
   # isi schema.prisma seperti di atas
   npx prisma migrate dev --name init
   ```

3. **Tambahkan Vercel Postgres**
   - Buka dashboard Vercel → project → tab **Storage** → **Create Database** → pilih **Postgres**.
   - Vercel otomatis mengisi `DATABASE_URL` ke environment variables project.

4. **Push ke GitHub, lalu import project di Vercel**
   ```bash
   git init
   git add .
   git commit -m "init kalender emosi"
   git remote add origin <repo-url>
   git push -u origin main
   ```
   - Buka [vercel.com/new](https://vercel.com/new), pilih repo, klik **Deploy**.

5. **Generate Prisma Client saat build**
   Tambahkan di `package.json`:
   ```json
   "scripts": {
     "build": "prisma generate && vite build"
   }
   ```

6. **Selesai** — frontend, backend (serverless functions), dan database semuanya jalan di satu domain Vercel, otomatis HTTPS dan auto-scaling.

---

## Prinsip Privasi

1. Data hanya bisa diakses lewat akun masing-masing pengguna (autentikasi JWT wajib di semua endpoint kecuali register/login).
2. Tidak ada endpoint yang mengirim data ke pihak ketiga atau institusi kampus.
3. Export data (CSV/JSON) hanya dipicu manual oleh pengguna dari halaman Settings.
4. PIN lock opsional untuk mengunci akses ke aplikasi di sisi frontend.