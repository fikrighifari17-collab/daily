import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = "postgresql://postgres.nkfyyhsihmwpwmahyyqd:Jrfikrizero123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: SUPABASE_URL
    }
  }
});

async function main() {
  const demoUser = await prisma.user.findUnique({
    where: { username: 'demo' }
  });

  if (!demoUser) {
    console.error("Demo user not found!");
    return;
  }

  const userId = demoUser.id;
  console.log("Seeding demo data for userId:", userId);

  // 1. Tags
  const tagNames = ['Kuliah & Tugas', 'Skripsi', 'Organisasi', 'Self-care', 'Olahraga', 'Keluarga'];
  const createdTags = [];
  for (const nama of tagNames) {
    let t = await prisma.tag.findFirst({ where: { userId, nama } });
    if (!t) {
      t = await prisma.tag.create({ data: { userId, nama } });
    }
    createdTags.push(t);
  }
  console.log(`Ensured ${createdTags.length} tags`);

  // 2. Coping Strategies
  const existingCoping = await prisma.copingStrategy.count({ where: { userId } });
  if (existingCoping === 0) {
    await prisma.copingStrategy.createMany({
      data: [
        {
          userId,
          namaStrategi: "Teknik Pernapasan 4-7-8",
          deskripsi: "Tarik napas 4 detik, tahan 7 detik, lalu hembuskan perlahan 8 detik untuk meredakan kecemasan."
        },
        {
          userId,
          namaStrategi: "Jalan Santai Tanpa Gadget 15 Menit",
          deskripsi: "Berjalan di luar ruangan sambil mengamati lingkungan sekitar untuk mengistirahatkan mata dan pikiran."
        },
        {
          userId,
          namaStrategi: "Jurnal Gratitude 3 Hal Baik",
          deskripsi: "Tuliskan 3 hal kecil yang patut disyukuri hari ini sebelum tidur."
        }
      ]
    });
    console.log("Created coping strategies");
  }

  // 3. Schedules
  const existingSchedules = await prisma.schedule.count({ where: { userId } });
  if (existingSchedules === 0) {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    await prisma.schedule.createMany({
      data: [
        {
          userId,
          judul: "Bimbingan Skripsi Bab 3",
          jenis: "Akademik",
          tanggal: today
        },
        {
          userId,
          judul: "Belajar & Review Materi Kuliah",
          jenis: "Belajar",
          tanggal: tomorrow
        }
      ]
    });
    console.log("Created demo schedules");
  }

  // 4. Academic Courses
  const existingCourses = await prisma.academicCourse.count({ where: { userId } });
  if (existingCourses === 0) {
    await prisma.academicCourse.createMany({
      data: [
        {
          userId,
          mataKuliah: "Kecerdasan Buatan & Sistem Pakar",
          dosen: "Dr. Ir. Hendra, M.Kom",
          hari: "Senin",
          jamMulai: "08:00",
          jamSelesai: "10:30",
          ruangan: "Lab AI 302",
          sks: 3,
          warna: "#00ADB5"
        },
        {
          userId,
          mataKuliah: "Metodologi Penelitian & Skripsi",
          dosen: "Prof. Rina Suryani, Ph.D",
          hari: "Rabu",
          jamMulai: "13:00",
          jamSelesai: "15:30",
          ruangan: "Gedung B 204",
          sks: 3,
          warna: "#10b981"
        }
      ]
    });
    console.log("Created demo academic courses");
  }

  // 5. Brain Dump
  const existingDumps = await prisma.brainDump.count({ where: { userId } });
  if (existingDumps === 0) {
    await prisma.brainDump.create({
      data: {
        userId,
        isi: "Ide revisi proposal bab 3: tambahkan perbandingan algoritma dan grafik evaluasi akurasi."
      }
    });
    console.log("Created demo brain dump note");
  }

  console.log("Demo seed finished successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
