import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

async function checkAuth() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return null;
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    await prisma.enquiry.update({ where: { id }, data: { status: "read" } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    await prisma.enquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
