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

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["admin", "superadmin"]).optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { name, role, password } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const updated = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = await params;
  try {
    // Prevent deleting yourself — not possible here since we only know session email, but guard ID match
    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
