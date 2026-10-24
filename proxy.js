import { NextResponse } from "next/server";
import { readSession } from "./lib/auth.js";

// Redirect on the server before any HTML is sent, so pages never paint blank or flash the wrong state.
export async function proxy(request) {
  const token = request.cookies.get("session")?.value;
  const loggedIn = Boolean(token && (await readSession(token)));
  const { pathname } = request.nextUrl;
  const appPage = pathname === "/pools" || pathname.startsWith("/pools/") || pathname === "/account";

  if (loggedIn && !appPage) return NextResponse.redirect(new URL("/pools", request.url));
  if (!loggedIn && appPage) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

// Only page routes; /api, /_next and static files never reach the proxy.
export const config = {
  matcher: ["/", "/login", "/register", "/finish-profile", "/pools/:path*", "/account"],
};
