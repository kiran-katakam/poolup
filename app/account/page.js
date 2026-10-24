"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client.js";
import { displayName } from "@/lib/rules.js";

const label = "block text-[15px] font-semibold";
const hint = "mt-1 block text-sm font-normal text-muted";
const GENDERS = { female: "Female", male: "Male", unspecified: "Prefer not to say" };

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null); // null = loading
  const [form, setForm] = useState({ name: "", nickname: "", phone: "" });
  const [status, setStatus] = useState(""); // "", "saving", "saved"
  const [error, setError] = useState("");

  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setStatus(""); };

  useEffect(() => {
    api("/api/auth/me").then((r) => {
      if (r.status === 401) return router.replace("/login");
      if (!r.ok) return setError(r.data.error || "Couldn't load your account, try again");
      setUser(r.data.user);
      setForm({ name: r.data.user.name, nickname: displayName(r.data.user), phone: r.data.user.phone });
    });
  }, [router]);

  async function save(e) {
    e.preventDefault();
    setError("");
    setStatus("saving");
    // Same as registration: keep digits, drop a leading country code.
    const phone = form.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    const r = await api("/api/account", { method: "POST", body: { ...form, phone } });
    if (r.status === 401) return router.replace("/login");
    if (r.ok) {
      setForm({ name: r.data.user.name, nickname: displayName(r.data.user), phone: r.data.user.phone });
      return setStatus("saved");
    }
    setError(r.data.error || "Couldn't save, try again");
    setStatus("");
  }

  async function logOut() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-[34px] font-bold leading-none">Your account</h1>

      <div className="card mt-5">
        <p className="text-[15px]">
          Email<span className="block font-mono font-medium [overflow-wrap:anywhere]">{user ? user.email : "…"}</span>
        </p>
        <p className="mt-3 text-[15px]">
          Gender<span className="block font-medium">{user ? GENDERS[user.gender] || "Not set" : "…"}</span>
        </p>
        <p className="mt-1 text-sm text-muted">Set when you signed up. These can&apos;t be changed.</p>
      </div>

      <form onSubmit={save} noValidate className="mt-5 flex flex-col gap-4">
        <label className={label}>
          Nickname
          <span className={hint}>What other students see in pools and chat. It starts as the name in your email.</span>
          <input className="field font-normal" autoComplete="nickname" maxLength={20} value={form.nickname} onChange={set("nickname")} disabled={!user} />
        </label>
        <label className={label}>
          Full name
          <input className="field font-normal" autoComplete="name" value={form.name} onChange={set("name")} disabled={!user} />
        </label>
        <label className={label}>
          WhatsApp number
          <span className={hint}>10 digits. Only shown to people in your pool, and only if you choose.</span>
          <input className="field font-mono font-medium" type="tel" inputMode="numeric" autoComplete="tel"
            value={form.phone} onChange={set("phone")} placeholder="98765 43210" disabled={!user} />
        </label>
        {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
        <button type="submit" className="btn" disabled={!user || status === "saving"}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <p role="status" className="min-h-6 text-center font-semibold text-go">{status === "saved" ? "Saved" : ""}</p>
      </form>

      <div className="mt-2 flex flex-col items-start">
        <Link href="/forgot-password" className="link inline-flex min-h-11 items-center text-[15px]">Change password</Link>
        <button type="button" onClick={logOut} className="link min-h-11 cursor-pointer text-[15px]">Log out</button>
      </div>
    </div>
  );
}
