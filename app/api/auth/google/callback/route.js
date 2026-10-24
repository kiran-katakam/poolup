import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { connectDB } from "@/lib/db.js";
import { googleAccountError, normalizeEmail } from "@/lib/rules.js";
import {
  signSession,
  setSessionCookie,
  signGoogleSignup,
  setGoogleSignupCookie,
  clearGoogleStateCookie,
} from "@/lib/auth.js";
import User from "@/lib/models/User.js";

// Google's public signing keys; jose fetches and caches them.
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

// Every exit clears google_state, so a state value works only once.
function redirectTo(request, path) {
  const response = NextResponse.redirect(new URL(path, request.url));
  clearGoogleStateCookie(response);
  return response;
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const savedState = request.cookies.get("google_state")?.value;

  if (params.get("error") || !code) return redirectTo(request, "/login?error=google");
  const stateOk = typeof state === "string" && state !== "" && typeof savedState === "string" && savedState !== "";
  if (!stateOk || state !== savedState) return redirectTo(request, "/login?error=google");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: new URL("/api/auth/google/callback", request.url).href,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("Google token exchange failed", tokenRes.status);
      return redirectTo(request, "/login?error=google");
    }
    const { id_token } = await tokenRes.json();

    // Throws if the signature, audience, issuer or expiry is wrong; caught below.
    const { payload: claims } = await jwtVerify(id_token, googleKeys, {
      audience: process.env.GOOGLE_CLIENT_ID,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });
    if (googleAccountError(claims)) return redirectTo(request, "/login?error=google_email");

    const email = normalizeEmail(claims.email);
    await connectDB();
    const user = await User.findOne({ email });
    if (user) {
      const response = redirectTo(request, "/pools");
      setSessionCookie(response, await signSession(String(user._id)));
      return response;
    }

    const response = redirectTo(request, "/finish-profile");
    setGoogleSignupCookie(response, await signGoogleSignup({ email, name: claims.name ?? "" }));
    return response;
  } catch (e) {
    console.error(e);
    return redirectTo(request, "/login?error=google");
  }
}
