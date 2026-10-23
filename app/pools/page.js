"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, nextIstDays } from "@/lib/client.js";
import { PLACES, placeShort } from "@/lib/places.js";
import PoolCard from "@/app/components/PoolCard";

const filterSelect = "h-11 min-w-0 flex-1 rounded-md border border-field bg-white px-2 text-sm";

export default function PoolsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ from: "", to: "", date: "" });
  const [pools, setPools] = useState(null); // null = loading
  const [mine, setMine] = useState(null);
  const [error, setError] = useState("");
  const [days, setDays] = useState([]);

  useEffect(() => {
    api("/api/pools/mine").then((r) => {
      if (r.ok) setMine(r.data.pool);
      setDays(nextIstDays()); // built in the browser: the current time can't be part of the prerendered page
    });
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
    api(`/api/pools?${query}`).then((r) => {
      if (r.status === 401) return router.replace("/login");
      setError(r.ok ? "" : r.data.error || "Couldn't load pools, try again");
      setPools(r.ok ? r.data.pools : []);
    });
  }, [filters, router]);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="pb-24">
      <h1 className="sr-only">Pools</h1>

      {mine && (
        <Link href={`/pools/${mine.id}`}
          className="mb-4 flex min-h-11 items-center justify-between gap-3 rounded-lg bg-ink px-3 py-2 text-white">
          <span className="font-display text-lg font-bold">
            <span className="tracking-[0.04em] text-yellow">YOUR POOL</span> {placeShort(mine.from)} <span aria-hidden="true">→</span><span className="sr-only">to</span> {placeShort(mine.to)}
          </span>
          <span className="shrink-0 font-mono text-[15px] font-bold text-yellow">₹{mine.farePerPerson} each</span>
        </Link>
      )}

      <div className="flex gap-2">
        <select aria-label="From" className={filterSelect} value={filters.from} onChange={setFilter("from")}>
          <option value="">From: Any</option>
          {PLACES.map((p) => <option key={p.id} value={p.id}>From: {p.short}</option>)}
        </select>
        <select aria-label="To" className={filterSelect} value={filters.to} onChange={setFilter("to")}>
          <option value="">To: Any</option>
          {PLACES.map((p) => <option key={p.id} value={p.id}>To: {p.short}</option>)}
        </select>
        <select aria-label="Day" className={filterSelect} value={filters.date} onChange={setFilter("date")}>
          <option value="">Any day</option>
          {days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="mt-4 font-semibold text-bad">{error}</p>}

      {pools === null ? (
        <div aria-busy="true" className="mt-3 flex flex-col gap-2.5">
          <span className="sr-only">Loading pools</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid h-[136px] grid-cols-[1fr_112px] overflow-hidden rounded-[10px] border border-line bg-white">
              <span /><span className="bg-ink/85" />
            </div>
          ))}
        </div>
      ) : pools.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2.5">
          {pools.map((p) => <li key={p.id}><PoolCard pool={p} /></li>)}
        </ul>
      ) : (
        !error && (
          <div className="mt-10 text-center">
            <p className="font-display text-[26px] font-bold">No pools yet. Create one.</p>
            <p className="mt-1 text-[15px] text-muted">
              {Object.values(filters).some(Boolean) ? "Nothing matches these filters. Try a different day or place." : "Be the first going your way, others can join you."}
            </p>
          </div>
        )
      )}

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-ground from-60% to-transparent pt-4 pb-5">
        <div className="mx-auto max-w-[480px] px-4">
          <Link href="/pools/new" className="btn h-[52px]">+ Create a pool</Link>
        </div>
      </div>
    </div>
  );
}
