import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import * as db from "@/lib/workspace-db";

// GET /api/admin/workspace/tasks?status=todo&project=hub&page=1&limit=50
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const result = db.listTasks({
    status:     sp.get("status")     ?? undefined,
    project:    sp.get("project")    ?? undefined,
    assigneeId: sp.get("assigneeId") ? Number(sp.get("assigneeId")) : undefined,
    sprintId:   sp.get("sprintId")   ? Number(sp.get("sprintId"))   : undefined,
    priority:   sp.get("priority")   ?? undefined,
    page:       sp.get("page")       ? Number(sp.get("page"))       : 1,
    limit:      sp.get("limit")      ? Number(sp.get("limit"))      : 50,
  });
  return NextResponse.json(result);
}

// POST /api/admin/workspace/tasks
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title?.trim())
    return NextResponse.json({ error: "title is required" }, { status: 400 });

  const task = db.createTask({ ...body, createdBy: typeof user.id === "number" ? user.id : null });
  return NextResponse.json(task, { status: 201 });
}
