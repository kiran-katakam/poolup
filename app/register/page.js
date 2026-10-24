"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client.js";
import GoogleButton from "@/app/components/GoogleButton";

const label = "block text-[15px] font-semibold";
const hint = "mt-1 block text-sm font-normal text-muted";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ otp: "", name: "", phone: "", gender: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function sendCode(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/auth/request-otp", { method: "POST", body: { email } });
    setBusy(false);
    if (r.ok) setStep(2);
    else setError(r.data.error || "Couldn't send the code, try again");
  }

  async function createAccount(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    // Accept "+91 98765 43210" too: keep digits, drop a leading country code.
    const phone = form.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    const r = await api("/api/auth/register", { method: "POST", body: { ...form, email, phone } });
    if (r.ok) return router.push("/pools");
    setError(r.data.error || "Couldn't create your account, try again");
    setBusy(false);
  }

  function changeEmail() {
    setStep(1);
    setError("");
    setForm({ ...form, otp: "" });
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-[34px] font-bold leading-none">Create account</h1>

      {step === 1 ? (
        <form onSubmit={sendCode} noValidate className="mt-5 flex flex-col gap-4">
          <label className={label}>
            College email
            <span className={hint}>Only @vitapstudent.ac.in or @vitap.ac.in. We&apos;ll email you a 6-digit code.</span>
            <input className="field font-normal" type="email" inputMode="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@vitapstudent.ac.in" />
          </label>
          {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
          <button type="submit" className="btn" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
          <p className="text-sm text-muted">Code not showing up? Check your spam folder.</p>
        </form>
      ) : (
        <form onSubmit={createAccount} noValidate className="mt-5 flex flex-col gap-4">
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
            Your name
            <span className={hint}>Pool members see this.</span>
            <input className="field font-normal" autoComplete="name" value={form.name} onChange={set("name")} />
          </label>
          <label className={label}>
            WhatsApp number
            <span className={hint}>10 digits. Only shown to people in your pool, and only if you choose.</span>
            <input className="field font-mono font-medium" type="tel" inputMode="numeric" autoComplete="tel"
              value={form.phone} onChange={set("phone")} placeholder="98765 43210" />
          </label>
          <label className={label}>
            Gender
            <span className={hint}>Decides who can see women-only pools. You can&apos;t change it later.</span>
            <select className="field select-chevron font-normal" value={form.gender} onChange={set("gender")}>
              <option value="" disabled>Choose…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="unspecified">Prefer not to say</option>
            </select>
          </label>
          <label className={label}>
            Password
            <span className={hint}>At least 8 characters.</span>
            <input className="field font-normal" type="password" autoComplete="new-password"
              value={form.password} onChange={set("password")} />
          </label>
          {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
          <button type="submit" className="btn" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </form>
      )}

      {step === 1 && <GoogleButton />}

      <p className="mt-5 text-[15px]">
        Already have an account? <Link href="/login" className="link">Log in</Link>
      </p>
    </div>
  );
}
