import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/admin"];
const publicPaths = ["/admin-login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isPublic = publicPaths.some((path) => pathname === path);

  if (!isProtected || isPublic) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("admin_email")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/admin-login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
