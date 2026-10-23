import { NextResponse } from "next/server";
import { fail } from "@/lib/http.js";
import { readGoogleSignup } from "@/lib/auth.js";

export async function GET(request) {
  const token = request.cookies.get("google_signup")?.value;
  const signup = token && (await readGoogleSignup(token));
  if (!signup) return fail(401, "Sign in with Google again");
  return NextResponse.json({ email: signup.email, name: signup.name });
}
