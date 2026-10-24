"use client";

import Link from "next/link";
import { useState } from "react";
import { formatWindow } from "@/lib/client.js";
import { placeShort } from "@/lib/places.js";

// The fare figure. When it goes down (someone joined) the new figure drops in once; reduced motion swaps instantly.
export function Fare({ value, className }) {
  const [shown, setShown] = useState(value);
  const [dropped, setDropped] = useState(false);
  if (value !== shown) {
    setDropped(value < shown);
    setShown(value);
  }
  return (
    <span key={shown} className={`inline-block font-mono font-bold tabular-nums text-yellow ${dropped ? "animate-meter-drop motion-reduce:animate-none" : ""} ${className}`}>
      ₹{shown}
    </span>
  );
}

// Seat pips shaped like an auto's back bench: filled = taken, outlined = free.
export function Seats({ taken, capacity, size = "h-3.5 w-[22px]", tone = "ink" }) {
  const [border, fill] = tone === "yellow" ? ["border-yellow", "bg-yellow"] : ["border-ink", "bg-ink"];
  return (
    <span role="img" aria-label={`${taken} of ${capacity} seats taken`} className="flex gap-1.5">
      {Array.from({ length: capacity }, (_, i) => (
        <span key={i} className={`${size} rounded-[3px_3px_6px_6px] border-2 transition-colors duration-200 motion-reduce:transition-none ${border} ${i < taken ? fill : ""}`} />
      ))}
    </span>
  );
}

export function seatsLeftText(pool) {
  if (pool.isFull) return "Full";
  return `${pool.seatsLeft} ${pool.seatsLeft === 1 ? "seat" : "seats"} left`;
}

export default function PoolCard({ pool }) {
  // Members are stored in join order, so the first one is whoever made the pool.
  const creator = pool.members[0]?.name;
  return (
    <Link href={`/pools/${pool.id}`}
      className="grid h-full grid-cols-[1fr_112px] overflow-hidden rounded-[10px] border border-line bg-white hover:border-ink">
      <span className="flex flex-col p-3">
        {pool.womenOnly && (
          <span className="mb-1.5 self-start rounded border-2 border-ink px-1.5 font-display text-[13px] font-bold uppercase tracking-[0.06em]">Women only</span>
        )}
        <span className="font-display text-[21px] font-bold leading-[1.1]">
          {placeShort(pool.from)} <span aria-hidden="true">→</span><span className="sr-only">to</span> {placeShort(pool.to)}
        </span>
        <span className="mt-1 font-mono text-[13px] tracking-[-0.03em] text-muted">{formatWindow(pool.departStart, pool.departEnd)}</span>
        {creator && <span className="text-[13px] text-muted">{pool.isCreator ? "Your pool" : `${creator}'s pool`}</span>}
        <span className="mt-2.5"><Seats taken={pool.memberCount} capacity={pool.capacity} /></span>
        <span className={`mt-1.5 text-[13px] font-semibold ${pool.isFull ? "text-muted" : "text-go"}`}>{seatsLeftText(pool)}</span>
      </span>
      <span className="flex flex-col items-center justify-center bg-ink px-1">
        <Fare value={pool.farePerPerson} className="text-[28px]" />
        <span className="mt-0.5 text-[11px] tracking-[0.14em] text-white">EACH NOW</span>
      </span>
    </Link>
  );
}
