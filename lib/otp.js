import { verifySecret } from "./auth.js";
import Otp from "./models/Otp.js";

const MAX_ATTEMPTS = 5;

// Checks an emailed code. Returns { otp } on a match (caller deletes it once used), or { error }.
export async function checkOtp(email, code) {
  // Claim an attempt before comparing, so parallel guesses can't exceed the limit.
  const otp = await Otp.findOneAndUpdate(
    { email, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
  if (!otp) return { error: "Code expired, request a new one" };

  if (!(await verifySecret(code, otp.codeHash))) {
    if (otp.attempts >= MAX_ATTEMPTS) await Otp.deleteOne({ _id: otp._id });
    return { error: "Wrong code" };
  }
  return { otp };
}
