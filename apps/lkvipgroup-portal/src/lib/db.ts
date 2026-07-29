import { PrismaClient } from ".prisma/fortress-client";

// Prisma singleton — tránh tạo nhiều connections trong Next.js dev hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __fortressPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__fortressPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__fortressPrisma = prisma;
}
