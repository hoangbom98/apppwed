import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";

/**
 * GET /api/admin-session
 * Returns the current admin user's public info (name, email, role).
 * Used by AdminNavbar to display real user data.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json(null, { status: 200 });
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
