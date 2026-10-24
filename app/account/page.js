"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client.js";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null); // null = loading
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState(""); // "", "saving", "saved"
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/auth/me").then((r) => {
      if (r.status === 401) return router.replace("/login");
      if (!r.ok) return setError(r.data.error || "Couldn't load your profile, try again");
      setUser(r.data.user);
      setGender(r.data.user.gender || "");
    });
  }, [router]);

  async function save(e) {
    e.preventDefault();
    setError("");
    if (!gender) return setError("Pick an option first");
    setStatus("saving");
    const r = await api("/api/profile", { method: "POST", body: { gender } });
    if (r.status === 401) return router.replace("/login");
    if (r.ok) return setStatus("saved");
    setError(r.data.error || "Couldn't save, try again");
    setStatus("");
  }

  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-none">Your profile</h1>
      {user && (
        <p className="mt-2 text-[15px] text-muted">{user.name} · {user.email}</p>
      )}

      <form onSubmit={save} noValidate className="mt-5 flex flex-col gap-4">
        <label className="block text-[15px] font-semibold">
          Gender
          <select className="field font-normal" value={gender} disabled={!user}
            onChange={(e) => { setGender(e.target.value); setStatus(""); }} aria-describedby="gender-note">
            <option value="" disabled>Choose…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="unspecified">Prefer not to say</option>
          </select>
          <span id="gender-note" className="mt-1.5 block text-sm font-normal text-muted">
            This decides who can see women-only pools.
          </span>
        </label>

        {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
        <button type="submit" className="btn" disabled={!user || status === "saving"}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <p role="status" className="min-h-6 text-center font-semibold text-go">{status === "saved" ? "Saved" : ""}</p>
      </form>
    </>
  );
}
