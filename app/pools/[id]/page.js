"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, formatWindow } from "@/lib/client.js";
import { Fare, Seats, seatsLeftText } from "@/app/components/PoolCard";
import Chat from "@/app/components/Chat";

function statusBadge(pool) {
  if (pool.status === "cancelled") return { text: "CANCELLED", className: "border-bad text-bad" };
  if (!pool.isActive) return { text: "DEPARTED", className: "border-muted text-muted" };
  if (pool.isFull) return { text: "FULL", className: "border-ink bg-ink text-yellow" };
  return null;
}

function Loading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading pool</span>
      <div className="mt-2 h-9 w-3/4 rounded bg-line" />
      <div className="mt-6 h-[180px] rounded-[10px] bg-ink/85" />
    </div>
  );
}

// The pool id is only known at request time, so the page waits for it inside Suspense.
export default function PoolPage() {
  return <Suspense fallback={<Loading />}><Pool /></Suspense>;
}

function Pool() {
  const { id } = useParams();
  const router = useRouter();
  const [pool, setPool] = useState(undefined); // undefined = loading, null = not found
  const [share, setShare] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [myId, setMyId] = useState(null);
  const [attempt, setAttempt] = useState(0); // bumped by "Try again" to reload

  useEffect(() => {
    api(`/api/pools/${id}`).then((r) => {
      if (r.status === 401) return router.replace("/login");
      if (r.ok) return setPool(r.data.pool);
      if (r.status === 404) return setPool(null);
      setError(r.data.error || "Couldn't load this pool, try again");
    });
    // Only to mark "you" in the member list and skip your own WhatsApp button.
    api("/api/auth/me").then((r) => r.ok && setMyId(r.data.user._id));
  }, [id, router, attempt]);

  // Every action returns the updated pool, so the page re-renders from that.
  async function act(action, body) {
    setBusy(true);
    setError("");
    const r = await api(`/api/pools/${id}/${action}`, { method: "POST", body });
    if (r.status === 401) return router.replace("/login");
    if (r.ok) setPool(r.data.pool);
    else setError(r.data.error || "That didn't work, try again");
    setBusy(false);
  }

  if (pool === null) {
    return (
      <>
        <h1 className="font-display text-[34px] font-bold leading-none">Can&apos;t find that pool</h1>
        <p className="mt-3 text-[17px] text-muted">The link may be wrong, or the pool is gone. Check the list for what&apos;s leaving soon.</p>
        <Link href="/pools" className="btn mt-6">See all pools</Link>
      </>
    );
  }

  if (pool === undefined && error) {
    return (
      <>
        <p role="alert" className="font-semibold text-bad">{error}</p>
        <button type="button" className="btn mt-4" onClick={() => { setError(""); setAttempt((a) => a + 1); }}>Try again</button>
      </>
    );
  }
  if (pool === undefined) return <Loading />;

  const badge = statusBadge(pool);
  const open = pool.isActive; // cancelled or departed pools are read-only
  const canJoin = !pool.isMember && open && !pool.isFull;

  return (
    <>
      {(badge || pool.womenOnly) && (
        <p className="mb-3 flex flex-wrap gap-2">
          {badge && (
            <span className={`rounded border-2 px-2 py-0.5 font-display text-lg font-bold tracking-[0.06em] ${badge.className}`}>
              {badge.text}
            </span>
          )}
          {pool.womenOnly && (
            <span className="rounded border-2 border-ink px-2 py-0.5 font-display text-lg font-bold uppercase tracking-[0.06em]">Women only</span>
          )}
        </p>
      )}
      <h1 className="font-display text-[34px] font-bold leading-[1.05] text-balance">
        {pool.fromLabel} <span aria-hidden="true">→</span><span className="sr-only">to</span> {pool.toLabel}
      </h1>
      <p className="mt-2 font-mono text-[15px]">{formatWindow(pool.departStart, pool.departEnd)}</p>

      <section aria-label="Fare" className="mt-5 flex flex-col items-center rounded-[10px] bg-ink px-4 py-6 text-center">
        <Fare value={pool.farePerPerson} className="text-[56px] leading-none" />
        <span className="mt-2 text-xs tracking-[0.14em] text-white">{open ? "EACH NOW" : "EACH"}</span>
        <span className="mt-4"><Seats taken={pool.memberCount} capacity={pool.capacity} size="h-5 w-8" tone="yellow" /></span>
        {open && (
          <span className="mt-3 text-[15px] text-white">
            {seatsLeftText(pool)} · ₹{pool.totalFare} split {pool.memberCount} {pool.memberCount === 1 ? "way" : "ways"}
          </span>
        )}
      </section>

      <section aria-labelledby="members-heading" className="mt-6">
        <h2 id="members-heading" className="font-display text-2xl font-bold">In this pool</h2>
        <ul className="mt-2 flex flex-col">
          {pool.members.map((m, i) => (
            <li key={m.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-line py-2">
              <span className="text-[17px]">
                {m.name}
                {m.id === myId && <span className="font-semibold"> (you)</span>}
                {i === 0 && <span className="text-sm text-muted"> · made this pool</span>}
              </span>
              {m.phone && m.id !== myId && (
                <a href={`https://wa.me/91${m.phone}`} target="_blank" rel="noopener noreferrer"
                  aria-label={`Message ${m.name} on WhatsApp`}
                  className="btn btn-outline min-h-11 w-auto shrink-0 px-3 text-base">
                  WhatsApp
                </a>
              )}
            </li>
          ))}
        </ul>
        {pool.isMember && open && (
          <p className="mt-2 text-sm text-muted">WhatsApp buttons show only for people who chose to share their number.</p>
        )}
      </section>

      {error && <p role="alert" className="mt-5 font-semibold text-bad">{error}</p>}

      {canJoin && (
        <div className="mt-6 flex flex-col gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="size-5 shrink-0 accent-ink" />
            Share my WhatsApp number with this pool
          </label>
          <button type="button" className="btn" disabled={busy} onClick={() => act("join", { sharePhone: share })}>
            {busy ? "Joining…" : `Join for ₹${Math.ceil(pool.totalFare / (pool.memberCount + 1))} each`}
          </button>
        </div>
      )}

      {pool.isMember && open && (
        <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <input type="checkbox" checked={pool.iShared} disabled={busy}
            onChange={(e) => act("share", { share: e.target.checked })} className="size-5 shrink-0 accent-ink" />
          Share my WhatsApp number with this pool
        </label>
      )}

      {pool.isMember && <Chat poolId={id} active={pool.isActive} myId={myId} />}

      {pool.isMember && open && (
        <div className="mt-12 border-t border-line pt-6">
          {pool.isCreator ? (
            <button type="button" className="btn btn-outline" disabled={busy}
              onClick={() => confirm("Cancel this pool for everyone in it?") && act("cancel")}>
              Cancel pool
            </button>
          ) : (
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => act("leave")}>
              Leave pool
            </button>
          )}
        </div>
      )}
    </>
  );
}
