import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import * as db from "@/lib/workspace-db";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/workspace/tasks/[id]/comments
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id }    = await params;
  const body      = await req.json();
  if (!body.content?.trim())
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  const actorId   = typeof user.id === "number" ? user.id : undefined;
  const comment   = await db.addComment(Number(id), body.content, actorId, user.name);
  return NextResponse.json(comment, { status: 201 });
}
