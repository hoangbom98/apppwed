import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { mediaService } from "@/services";
import { getCurrentUser } from "@/lib/auth-utils";

async function checkAuth() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return null;
}

/** GET /api/admin/media — list all uploads */
export async function GET() {
  const deny = await checkAuth();
  if (deny) return deny;
  try {
    const items = await prisma.upload.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

/** DELETE /api/admin/media?id=<db-id>  — delete by DB row id */
export async function DELETE(req: NextRequest) {
  const deny = await checkAuth();
  if (deny) return deny;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const record = await prisma.upload.findUnique({ where: { id } });
    if (!record)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await mediaService.deleteFile(record.publicId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
