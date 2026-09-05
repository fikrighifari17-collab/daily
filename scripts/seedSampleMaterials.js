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
    where: { username: 'demo' },
    include: { academicCourses: true }
  });

  if (!demoUser || demoUser.academicCourses.length === 0) {
    console.log("No courses found for demo user");
    return;
  }

  for (const c of demoUser.academicCourses) {
    const att = c.attendance || { present: 0, absent: 0, excused: 0, target: 16 };
    if (!att.materials || att.materials.length === 0) {
      const sampleMaterials = [
        {
          id: 'mat-demo-1',
          pertemuan: 1,
          judul: `Pengantar & Kontrak Kuliah ${c.mataKuliah}`,
          namaFile: `Pertemuan_1_Pengantar_${c.mataKuliah.replace(/\s+/g, '_')}.pptx`,
          tipeFile: 'pptx',
          ukuranFile: '3.4 MB',
          fileData: null,
          externalLink: 'https://docs.google.com/presentation',
          catatan: 'Slide presentasi pengantar dari dosen, pelajari silabus semester ini.',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: 'mat-demo-2',
          pertemuan: 2,
          judul: `Modul Pembahasan Bab 2 & Tugas Mandiri`,
          namaFile: `Modul_Pertemuan_2_${c.mataKuliah.replace(/\s+/g, '_')}.docx`,
          tipeFile: 'docx',
          ukuranFile: '1.2 MB',
          fileData: null,
          externalLink: 'https://docs.google.com/document',
          catatan: 'Dokumen Word modul referensi dan petunjuk pengerjaan studi kasus.',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];

      att.materials = sampleMaterials;
      await prisma.academicCourse.update({
        where: { id: c.id },
        data: { attendance: att }
      });
      console.log(`Added sample PPT & Word materials to course: ${c.mataKuliah}`);
    }
  }

  console.log("Materials seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
