import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import * as db from "@/lib/workspace-db";

// GET /api/admin/workspace/sprints?status=active
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  return NextResponse.json(await db.listSprints(status));
}

// POST /api/admin/workspace/sprints
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name || !body.startDate || !body.endDate)
    return NextResponse.json({ error: "name, startDate, endDate are required" }, { status: 400 });
  const sprint = await db.createSprint(body);
  return NextResponse.json(sprint, { status: 201 });
}
