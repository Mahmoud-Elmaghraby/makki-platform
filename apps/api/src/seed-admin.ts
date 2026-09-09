// سكريبت تشغيل يدوي (مش جزء من الـ app نفسها) لإنشاء أول حساب أدمن، لأن مفيش
// طريقة تانية لعمل أول حساب في نظام مفيهوش تسجيل عام للأدمن/المدرب — كله
// بينشئه أدمن موجود بالفعل. تشغيل: `pnpm --filter api exec ts-node src/seed-admin.ts`
// (أو عن طريق سكريبت "seed:admin" في package.json).
import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Role } from './generated/prisma/enums';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'مدير النظام';

  if (!email || !password) {
    throw new Error(
      'لازم تحدد SEED_ADMIN_EMAIL و SEED_ADMIN_PASSWORD في .env قبل ما تشغّل السكريبت ده',
    );
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`فيه حساب بالإيميل ده بالفعل (${email}) — مفيش حاجة اتعملت.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: { email, passwordHash, name, role: Role.ADMIN },
    });

    console.log(`تم إنشاء حساب الأدمن بنجاح: ${admin.email}`);
    console.log('غيّر كلمة السر دي فورًا بعد أول تسجيل دخول.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('فشل تشغيل seed-admin:', err);
  process.exit(1);
});
