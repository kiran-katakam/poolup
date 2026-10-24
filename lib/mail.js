import { Resend } from "resend";

const COPY = {
  register: { subject: "Your PoolUp sign-up code", heading: "Your sign-up code", line: "Enter this code to finish creating your account." },
  reset: { subject: "Reset your PoolUp password", heading: "Reset your password", line: "Enter this code to set a new password." },
};

// Email clients ignore <style> and web fonts, so this is a table with inline styles.
// Colours match the app: auto-yellow header, ink band, cool grey ground, white card, yellow-on-ink code.
export function otpEmail(code, purpose = "register") {
  const c = COPY[purpose] ?? COPY.register;
  const footer = "It works for 10 minutes. Didn't ask for it? Ignore this email, nothing changes.";
  // DESIGN.md's stacks; clients without the web fonts use the fallbacks.
  const display = "'Barlow Condensed', 'Arial Narrow', sans-serif";
  const body = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  const mono = "'Roboto Mono', ui-monospace, monospace";
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ececec;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ececec;">
  <tr><td style="background:#ffc928;padding:14px 24px;font-family:${display};font-size:26px;font-weight:700;letter-spacing:2px;color:#141414;">POOLUP</td></tr>
  <tr><td style="background:#141414;height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
  <tr><td align="center" style="padding:28px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border:1px solid #dedad0;border-radius:10px;">
      <tr><td style="padding:24px 24px 0;font-family:${display};font-size:28px;font-weight:700;color:#141414;">${c.heading}</td></tr>
      <tr><td style="padding:8px 24px 0;font-family:${body};font-size:15px;line-height:1.5;color:#4a4a4a;">${c.line}</td></tr>
      <tr><td style="padding:20px 24px;">
        <div style="background:#141414;border-radius:10px;padding:18px 0;text-align:center;font-family:${mono};font-size:36px;font-weight:700;letter-spacing:10px;color:#ffc928;">${code}</div>
      </td></tr>
      <tr><td style="padding:0 24px 24px;font-family:${body};font-size:13px;line-height:1.5;color:#4a4a4a;">${footer}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-family:${body};font-size:12px;color:#4a4a4a;">PoolUp · split the auto with VIT-AP batchmates</p>
  </td></tr>
</table>
</body></html>`;
  return { subject: `${c.subject}: ${code}`, text: `${c.line} Your PoolUp code is ${code}. ${footer}`, html };
}

export async function sendOtp(email, code, purpose) {
  const resend = new Resend(process.env.RESEND);
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM, to: email, ...otpEmail(code, purpose) });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}
