import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import { fail } from "@/lib/http.js";
import { registerSchema, parseBody } from "@/lib/validation.js";
import { hashSecret, signSession, setSessionCookie } from "@/lib/auth.js";
import { checkOtp } from "@/lib/otp.js";
import User from "@/lib/models/User.js";
import Otp from "@/lib/models/Otp.js";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { data, error } = parseBody(registerSchema, body);
  if (error) return fail(400, error);

  try {
    await connectDB();
    const { otp, error: otpError } = await checkOtp(data.email, data.otp);
    if (otpError) return fail(400, otpError);

    let user;
    try {
      user = await User.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        passwordHash: await hashSecret(data.password),
      });
    } catch (e) {
      if (e.code === 11000) {
        await Otp.deleteOne({ _id: otp._id });
        return fail(409, "You already have an account. Log in instead.");
      }
      throw e;
    }
    await Otp.deleteOne({ _id: otp._id });

    const response = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(response, await signSession(String(user._id)));
    return response;
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
