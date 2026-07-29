/**
 * Prisma seed script — tạo admin user mặc định
 * Chạy: npx ts-node --project tsconfig.json scripts/seed.ts
 * hoặc:  npm run db:seed
 */
import { PrismaClient } from "../node_modules/.prisma/fortress-client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@lkvip.group";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@LKVIP2026!";

  const hashed = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, password: hashed, name: "LKVIP Admin" },
    update: { password: hashed },
  });

  console.log(`✅ Admin seeded: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
