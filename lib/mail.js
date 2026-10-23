import { Resend } from "resend";

export async function sendOtp(email, code) {
  const resend = new Resend(process.env.RESEND);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Your PoolUp code: ${code}`,
    text: `Your PoolUp code is ${code}. It works for 10 minutes. Didn't ask for it? Ignore this email.`,
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}
