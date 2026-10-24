import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import { fail } from "@/lib/http.js";
import { resetPasswordSchema, parseBody } from "@/lib/validation.js";
import { hashSecret, signSession, setSessionCookie } from "@/lib/auth.js";
import { checkOtp } from "@/lib/otp.js";
import User from "@/lib/models/User.js";
import Otp from "@/lib/models/Otp.js";

// Also how a Google-only account sets its first password.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { data, error } = parseBody(resetPasswordSchema, body);
  if (error) return fail(400, error);

  try {
    await connectDB();
    const { otp, error: otpError } = await checkOtp(data.email, data.otp);
    if (otpError) return fail(400, otpError);
    await Otp.deleteOne({ _id: otp._id });

    const user = await User.findOneAndUpdate(
      { email: data.email },
      { passwordHash: await hashSecret(data.password) },
      { returnDocument: "after" },
    );
    if (!user) return fail(404, "No account with this email. Create one instead.");

    const response = NextResponse.json({ user });
    setSessionCookie(response, await signSession(String(user._id)));
    return response;
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
