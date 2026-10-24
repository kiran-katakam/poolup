"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/client.js";
import GoogleButton from "@/app/components/GoogleButton";

// Same accounts as scripts/seed.js.
const DEMO_ACCOUNTS = [
  { email: "demo1@vitapstudent.ac.in", gender: "Male" },
  { email: "demo2@vitapstudent.ac.in", gender: "Female" },
  { email: "demo3@vitapstudent.ac.in", gender: "Male" },
  { email: "demo4@vitapstudent.ac.in", gender: "Female" },
];
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
    <div className="mx-auto grid max-w-md gap-8 lg:max-w-none lg:grid-cols-2 lg:gap-16">
      <div>
        <h1 className="font-display text-[34px] font-bold leading-none lg:text-[44px]">Log in</h1>
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
      </div>

      <section aria-labelledby="demo-heading" className="card self-start lg:mt-[60px] lg:p-6">
        <h2 id="demo-heading" className="font-display text-2xl font-bold">Just looking around?</h2>
        <p className="mt-1 text-sm text-muted">
          Use a demo account. All four share this password:{" "}
          <span className="font-mono text-[15px] font-medium text-ink">{DEMO_PASSWORD}</span>
        </p>
        <p className="mt-1 text-sm text-muted">Women-only pools show up only for the female accounts.</p>
        <ul className="mt-3 flex flex-col">
          {DEMO_ACCOUNTS.map((demo) => (
            <li key={demo.email} className="flex items-center justify-between gap-3 border-t border-line py-2.5">
              <span className="flex min-w-0 flex-col">
                <span className="font-mono text-[14px] [overflow-wrap:anywhere]">{demo.email}</span>
                <span className="text-[13px] font-semibold text-muted">{demo.gender}</span>
              </span>
              <button type="button" className="btn btn-outline min-h-11 w-auto shrink-0 px-4 text-lg"
                aria-label={`Fill demo account ${demo.email}`}
                onClick={() => { setEmail(demo.email); setPassword(DEMO_PASSWORD ?? ""); setError(""); }}>
                Fill
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
