import bcrypt from 'bcryptjs';
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
  const username = 'demo';
  const password = 'demo123';
  const nama = 'Demo User';

  const existing = await prisma.user.findUnique({
    where: { username }
  });

  if (existing) {
    console.log("User 'demo' already exists in DB! ID:", existing.id);
    // Update password to demo123 to be sure
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashedPassword, nama }
    });
    console.log("Updated 'demo' password to 'demo123'");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nama
      }
    });
    console.log("Created user 'demo' successfully! ID:", user.id);
  }
}

main()
  .catch(e => {
    console.error("Error creating demo user:", e.message);
  })
  .finally(() => prisma.$disconnect());
