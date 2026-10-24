import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import { fail } from "@/lib/http.js";
import { googleCompleteSchema, parseBody } from "@/lib/validation.js";
import { normalizeEmail } from "@/lib/rules.js";
import { readGoogleSignup, clearGoogleSignupCookie, signSession, setSessionCookie } from "@/lib/auth.js";
import User from "@/lib/models/User.js";

export async function POST(request) {
  const token = request.cookies.get("google_signup")?.value;
  const signup = token && (await readGoogleSignup(token));
  if (!signup) return fail(401, "Sign in with Google again");

  const body = await request.json().catch(() => null);
  const { data, error } = parseBody(googleCompleteSchema, body);
  if (error) return fail(400, error);

  try {
    await connectDB();
    let user;
    try {
      // Email comes only from the signed cookie (Google verified it); no passwordHash for Google accounts.
      user = await User.create({ email: normalizeEmail(signup.email), name: data.name, phone: data.phone, gender: data.gender });
    } catch (e) {
      if (e.code === 11000) return fail(409, "You already have an account. Log in instead.");
      throw e;
    }

    const response = NextResponse.json({ user }, { status: 201 });
    clearGoogleSignupCookie(response);
    setSessionCookie(response, await signSession(String(user._id)));
    return response;
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
