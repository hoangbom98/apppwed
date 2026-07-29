import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/products", "/cart", "/checkout", "/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /customer/* routes
  if (!pathname.startsWith("/customer")) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("hub_access_token")?.value ||
    request.cookies.get("trade_access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/customer/:path*"],
};
