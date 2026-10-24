"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client.js";

const label = "block text-[15px] font-semibold";
const hint = "mt-1 block text-sm font-normal text-muted";

export default function FinishProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); // "" = loading
  const [expired, setExpired] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", gender: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  useEffect(() => {
    api("/api/auth/google/pending").then((r) => {
      if (r.status === 401) return setExpired(true);
      if (!r.ok) return setError(r.data.error || "Couldn't load your details, try again");
      setEmail(r.data.email);
      setForm((f) => ({ ...f, name: r.data.name || "" }));
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    // Same as registration: keep digits, drop a leading country code.
    const phone = form.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    const r = await api("/api/auth/google/complete", { method: "POST", body: { ...form, phone } });
    if (r.ok) return router.push("/pools");
    if (r.status === 401) return setExpired(true);
    setError(r.data.error || "Couldn't create your account, try again");
    setBusy(false);
  }

  if (expired) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-[34px] font-bold leading-none">Sign in again</h1>
        <p className="mt-3 text-[15px]">Your Google sign-in timed out or didn&apos;t finish.</p>
        <p className="mt-4 text-[15px]"><Link href="/login" className="link">Back to log in</Link></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-[34px] font-bold leading-none">Finish your profile</h1>

      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <div className="card">
          <p className="text-[15px]">
            Signed in with Google as<span className="block font-mono font-medium [overflow-wrap:anywhere]">{email || "…"}</span>
          </p>
        </div>
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
          <span className={hint}>At least 8 characters. Lets you log in with your email too, not only Google.</span>
          <input className="field font-normal" type="password" autoComplete="new-password"
            value={form.password} onChange={set("password")} />
        </label>
        {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
        <button type="submit" className="btn" disabled={!email || busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
    </div>
  );
}
