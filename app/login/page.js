"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/client.js";
import GoogleButton from "@/app/components/GoogleButton";

const DEMO_EMAILS = ["demo1@vitapstudent.ac.in", "demo2@vitapstudent.ac.in"];
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

// Set by the Google callback when it sends the student back here.
const GOOGLE_ERRORS = {
  google: "Google sign-in didn't finish. Try again.",
  google_email: "Use your @vitapstudent.ac.in or @vitap.ac.in Google account.",
};

// Search params are only known at request time, so this reads them inside Suspense.
function GoogleError() {
  const message = GOOGLE_ERRORS[useSearchParams().get("error")];
  return message ? <p role="alert" className="mt-4 font-semibold text-bad">{message}</p> : null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/auth/login", { method: "POST", body: { email, password } });
    if (r.ok) return router.push("/pools");
    setError(r.data.error || "Couldn't log in, try again");
    setBusy(false);
  }

  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-none">Log in</h1>
      <Suspense fallback={null}><GoogleError /></Suspense>

      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <label className="block text-[15px] font-semibold">
          College email
          <input className="field font-normal" type="email" inputMode="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@vitapstudent.ac.in" />
        </label>
        <label className="block text-[15px] font-semibold">
          Password
          <input className="field font-normal" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <Link href="/forgot-password" className="link -mt-3 inline-flex min-h-11 items-center self-start text-sm">Forgot password?</Link>
        {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
        <button type="submit" className="btn" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>

      <GoogleButton />

      <p className="mt-4 text-[15px]">
        New here? <Link href="/register" className="link">Create an account</Link>
      </p>

      <section aria-labelledby="demo-heading" className="card mt-8">
        <h2 id="demo-heading" className="font-display text-xl font-bold">Just looking around?</h2>
        <p className="mt-1 text-sm text-muted">Use a demo account. Both share this password:</p>
        <p className="mt-1 font-mono text-[15px] font-medium">{DEMO_PASSWORD}</p>
        <ul className="mt-3 flex flex-col gap-3">
          {DEMO_EMAILS.map((demo) => (
            <li key={demo} className="flex flex-col gap-2 border-t border-line pt-3">
              <span className="font-mono text-[14px] [overflow-wrap:anywhere]">{demo}</span>
              <button type="button" className="btn btn-outline min-h-11 text-lg"
                aria-label={`Fill demo account ${demo}`}
                onClick={() => { setEmail(demo); setPassword(DEMO_PASSWORD ?? ""); setError(""); }}>
                Fill demo account
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
