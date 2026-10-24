import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { setGoogleStateCookie } from "@/lib/auth.js";

export async function GET(request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set");
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", new URL("/api/auth/google/callback", request.url).href);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  // Lets students with several Google accounts pick their college one.
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  setGoogleStateCookie(response, state);
  return response;
}
