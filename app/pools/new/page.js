"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client.js";
import { PLACES } from "@/lib/places.js";

const label = "block text-[15px] font-semibold";
const HALF_HOUR = 30 * 60 * 1000;

// datetime-local wants "YYYY-MM-DDTHH:mm" in the browser's own time zone.
function toLocalInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function NewPoolPage() {
  const router = useRouter();
  const [form, setForm] = useState({ from: "campus", to: "", start: "", end: "", capacity: 4, fare: "400", share: true, womenOnly: false });
  const [limits, setLimits] = useState({ min: "", max: "" }); // datetime-local min/max: now to 7 days ahead
  const [mine, setMine] = useState(null);
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/pools/mine").then((r) => {
      if (r.status === 401) return router.replace("/login");
      if (r.ok) setMine(r.data.pool);
      // Default to the next half hour. Done in the browser: the current time can't be part of the prerendered page.
      const start = new Date(Math.ceil(Date.now() / HALF_HOUR) * HALF_HOUR);
      setForm((f) => ({ ...f, start: toLocalInput(start), end: toLocalInput(new Date(start.getTime() + HALF_HOUR)) }));
      setLimits({ min: toLocalInput(new Date()), max: toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) });
    });
    api("/api/auth/me").then((r) => r.ok && setMe(r.data.user)); // only to know whether to offer "Women only"
  }, [router]);

  // One end is always campus: a city From forces To to campus, and campus From offers only city places.
  const setFrom = (e) => {
    const from = e.target.value;
    setForm((f) => ({ ...f, from, to: from !== "campus" ? "campus" : f.to === "campus" ? "" : f.to }));
  };
  const toPlaces = PLACES.filter((p) => (form.from === "campus" ? p.id !== "campus" : p.id === "campus"));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.to || form.from === form.to) return setError("Pick two different places");
    if (!form.start || !form.end) return setError("Pick a start and end time");
    if (!form.fare) return setError("Enter the total fare for the auto");
    setBusy(true);
    const r = await api("/api/pools", {
      method: "POST",
      body: {
        from: form.from,
        to: form.to,
        departStart: new Date(form.start).toISOString(),
        departEnd: new Date(form.end).toISOString(),
        capacity: form.capacity,
        totalFare: Number(form.fare),
        sharePhone: form.share,
        womenOnly: form.womenOnly,
      },
    });
    if (r.ok) return router.push(`/pools/${r.data.pool.id}`);
    if (r.status === 401) return router.replace("/login");
    if (r.status === 409) {
      const m = await api("/api/pools/mine"); // already in a pool: fetch it so we can link to it
      if (m.ok) setMine(m.data.pool);
    }
    setError(r.data.error || "Couldn't create the pool, try again");
    setBusy(false);
  }

  const each = Math.ceil(Number(form.fare) / form.capacity);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-[34px] font-bold leading-none">Create a pool</h1>

      {mine && (
        <div role="alert" className="card mt-5">
          <p className="font-semibold">You&apos;re already in a pool. You can only be in one at a time.</p>
          <Link href={`/pools/${mine.id}`} className="btn mt-3">Go to your pool</Link>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            From
            <select className="field select-chevron pr-8 font-normal" value={form.from} onChange={setFrom}>
              {PLACES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className={label}>
            To
            <select className="field select-chevron pr-8 font-normal" value={form.to} onChange={set("to")}>
              <option value="" disabled>Pick a place</option>
              {toPlaces.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className={label}>Leaving between</legend>
          <div className="mt-1.5 flex flex-col gap-3">
            <label className="text-sm text-muted">
              Earliest
              <input type="datetime-local" className="field text-ink" min={limits.min} max={limits.max} value={form.start} onChange={set("start")} />
            </label>
            <label className="text-sm text-muted">
              Latest
              <input type="datetime-local" className="field text-ink" min={limits.min} max={limits.max} value={form.end} onChange={set("end")} />
            </label>
          </div>
          <p className="mt-1.5 text-sm text-muted">Up to 3 hours apart, within the next 7 days.</p>
        </fieldset>

        <fieldset>
          <legend className={label}>Seats in the auto, you included</legend>
          <div className="mt-1.5 grid grid-cols-4 overflow-hidden rounded-md border-2 border-ink">
            {[2, 3, 4, 5].map((n) => (
              <label key={n} className="flex min-h-12 cursor-pointer items-center justify-center border-l-2 border-ink font-mono text-lg font-bold first:border-l-0 has-checked:bg-ink has-checked:text-yellow has-focus-visible:outline-3 has-focus-visible:-outline-offset-4 has-focus-visible:outline-yellow">
                <input type="radio" name="capacity" value={n} checked={form.capacity === n}
                  onChange={() => setForm((f) => ({ ...f, capacity: n }))} className="sr-only" />
                {n}
              </label>
            ))}
          </div>
        </fieldset>

        <label className={label}>
          Total auto fare (₹)
          <input type="number" inputMode="numeric" min="50" max="5000" step="10" className="field font-mono font-normal"
            value={form.fare} onChange={set("fare")} aria-describedby="fare-each" />
          <span id="fare-each" className="mt-1.5 block text-sm font-normal text-muted">
            {each > 0 ? <><span className="font-mono font-bold text-ink">₹{each}</span> each when full</> : "Enter the fare to see the split"}
          </span>
        </label>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <input type="checkbox" checked={form.share} onChange={set("share")} className="size-5 shrink-0 accent-ink" />
          Share my WhatsApp number with this pool
        </label>

        {me?.gender === "female" && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" checked={form.womenOnly} onChange={set("womenOnly")} className="size-5 shrink-0 accent-ink" />
            Women only (only women can see and join)
          </label>
        )}

        {error && <p role="alert" className="font-semibold text-bad">{error}</p>}
        <button type="submit" className="btn" disabled={busy}>{busy ? "Creating…" : "Create pool"}</button>
      </form>
    </div>
  );
}
