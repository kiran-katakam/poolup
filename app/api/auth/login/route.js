import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import { fail } from "@/lib/http.js";
import { loginSchema, parseBody } from "@/lib/validation.js";
import { verifySecret, signSession, setSessionCookie } from "@/lib/auth.js";
import User from "@/lib/models/User.js";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { data, error } = parseBody(loginSchema, body);
  if (error) return fail(400, error);

  try {
    await connectDB();
    const user = await User.findOne({ email: data.email });
    // Same answer for unknown email and wrong password, so emails can't be probed.
    if (!user || !(await verifySecret(data.password, user.passwordHash))) {
      return fail(401, "Wrong email or password");
    }
    const response = NextResponse.json({ user });
    setSessionCookie(response, await signSession(String(user._id)));
    return response;
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
