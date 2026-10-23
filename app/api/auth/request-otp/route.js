import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import { fail } from "@/lib/http.js";
import { otpRequestSchema, parseBody } from "@/lib/validation.js";
import { generateOtp, hashSecret } from "@/lib/auth.js";
import { sendOtp } from "@/lib/mail.js";
import User from "@/lib/models/User.js";
import Otp from "@/lib/models/Otp.js";

const RESEND_WAIT_MS = 60 * 1000;
const OTP_LIFETIME_MS = 10 * 60 * 1000;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { data, error } = parseBody(otpRequestSchema, body);
  if (error) return fail(400, error);

  try {
    await connectDB();
    if (await User.exists({ email: data.email })) return fail(409, "You already have an account. Log in instead.");

    const now = Date.now();
    const old = await Otp.findOne({ email: data.email });
    if (old && now - old.createdAt.getTime() < RESEND_WAIT_MS) {
      const secondsLeft = Math.ceil((RESEND_WAIT_MS - (now - old.createdAt.getTime())) / 1000);
      return fail(429, `Wait ${secondsLeft}s before asking for another code`);
    }

    const code = generateOtp();
    await Otp.findOneAndUpdate(
      { email: data.email },
      { codeHash: await hashSecret(code), attempts: 0, expiresAt: new Date(now + OTP_LIFETIME_MS), createdAt: new Date(now) },
      { upsert: true },
    );

    try {
      await sendOtp(data.email, code);
    } catch (e) {
      console.error(e);
      // Delete so the failed send doesn't block a retry with the 60s wait.
      await Otp.deleteOne({ email: data.email });
      return fail(502, "Couldn't send the email, try again");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
