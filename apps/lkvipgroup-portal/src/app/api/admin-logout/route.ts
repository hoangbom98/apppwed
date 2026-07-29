import { NextResponse } from "next/server";
import { logoutAdmin } from "@/lib/auth-utils";

/** POST /api/admin-logout — from client form submission */
export async function POST() {
  await logoutAdmin();
  return NextResponse.redirect(new URL("/admin-login", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"));
}

/** GET /api/admin-logout — navigational logout link from sidebar */
export async function GET() {
  await logoutAdmin();
  const response = NextResponse.redirect(new URL("/admin-login", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"));
  return response;
}
