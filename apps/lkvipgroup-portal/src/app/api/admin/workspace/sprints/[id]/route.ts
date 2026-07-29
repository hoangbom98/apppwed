import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import * as db from "@/lib/workspace-db";

// PATCH /api/admin/workspace/sprints/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body  = await req.json();
  const result = db.updateSprint(Number(id), body);
  if (!result) return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  return NextResponse.json(result);
}
