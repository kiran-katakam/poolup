"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client.js";

const label = "block text-[15px] font-semibold";
const hint = "mt-1 block text-sm font-normal text-muted";

// Works logged in or out (not in the proxy matcher), so the Account page can link here too.
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ otp: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function sendCode(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/auth/request-otp", { method: "POST", body: { email, purpose: "reset" } });
    setBusy(false);
    if (r.ok) setStep(2);
    else setError(r.data.error || "Couldn't send the code, try again");
  }

  async function resetPassword(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/auth/reset-password", { method: "POST", body: { ...form, email } });
    if (r.ok) return router.push("/pools");
    setError(r.data.error || "Couldn't change your password, try again");
    setBusy(false);
  }

  function changeEmail() {
    setStep(1);
    setError("");
    setForm({ ...form, otp: "" });
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-[34px] font-bold leading-none">Reset password</h1>

      {step === 1 ? (
        <form onSubmit={sendCode} noValidate className="mt-5 flex flex-col gap-4">
          <label className={label}>
            College email
            <span className={hint}>We&apos;ll email you a 6-digit code. Signed up with Google? This sets a password for email login.</span>
            <input className="field font-normal" type="email" inputMode="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@vitapstudent.ac.in" />
          </label>
          {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
          <button type="submit" className="btn" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
          <p className="text-sm text-muted">Code not showing up? Check your spam folder.</p>
        </form>
      ) : (
        <form onSubmit={resetPassword} noValidate className="mt-5 flex flex-col gap-4">
          <div className="card">
            <p className="text-[15px]">
              Code sent to<span className="block font-mono font-medium [overflow-wrap:anywhere]">{email.trim().toLowerCase()}</span>
            </p>
            <p className="mt-1 text-sm text-muted">Not in your inbox? Check spam. It&apos;s valid for 10 minutes.</p>
            <button type="button" onClick={changeEmail} className="link mt-1 min-h-11 cursor-pointer text-[15px]">
              Use a different email
            </button>
          </div>
          <label className={label}>
            6-digit code
            <input className="field font-mono text-xl font-medium tracking-[0.3em]" inputMode="numeric"
              autoComplete="one-time-code" maxLength={6} value={form.otp} onChange={set("otp")} />
          </label>
          <label className={label}>
            New password
            <span className={hint}>At least 8 characters.</span>
            <input className="field font-normal" type="password" autoComplete="new-password"
              value={form.password} onChange={set("password")} />
          </label>
          {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
          <button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : "Set new password"}</button>
        </form>
      )}

      <p className="mt-5 text-[15px]">
        Remembered it? <Link href="/login" className="link">Log in</Link>
      </p>
    </div>
  );
}
