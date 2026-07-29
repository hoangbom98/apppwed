import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { z } from "zod";

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role !== "superadmin")
    return NextResponse.json({ success: false, message: "Forbidden — superadmin only" }, { status: 403 });
  return null;
}

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "superadmin"]).default("admin"),
});

export async function GET() {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  try {
    const users = await prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, lastLogin: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { name, email, password, role } = parsed.data;
    const exists = await prisma.admin.findUnique({ where: { email } });
    if (exists)
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.admin.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
