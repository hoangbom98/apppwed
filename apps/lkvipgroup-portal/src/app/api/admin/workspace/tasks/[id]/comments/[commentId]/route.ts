import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import * as db from "@/lib/workspace-db";

type Params = { params: Promise<{ id: string; commentId: string }> };

// DELETE /api/admin/workspace/tasks/[id]/comments/[commentId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { commentId } = await params;
  const ok = await db.deleteComment(Number(commentId));
  if (!ok) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
