import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const FALLBACK_USERNAME = process.env.ADMIN_USERNAME || "admin";
const FALLBACK_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    try {
      const admin = await prisma.admin.findFirst({
        where: { OR: [{ email: username.toLowerCase() }, { name: username }] },
      });

      if (admin) {
        const valid = await bcrypt.compare(password, admin.password);
        if (valid) {
          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() },
          });
          const cookieStore = await cookies();
          cookieStore.set("admin_email", admin.email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
          });
          return NextResponse.json({ success: true });
        }
      }
    } catch {
      // DB not available, fall through to fallback
    }

    if (username === FALLBACK_USERNAME && password === FALLBACK_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("admin_email", FALLBACK_USERNAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}
