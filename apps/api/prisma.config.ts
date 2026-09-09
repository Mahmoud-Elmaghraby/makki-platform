import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// من Prisma 7: رابط قاعدة البيانات (لأوامر migrate/CLI) بقى هنا مش في
// schema.prisma. عميل التشغيل الفعلي (PrismaService) بيستخدم adapter منفصل
// (@prisma/adapter-pg) بنفس الرابط ده من apps/api/.env.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
