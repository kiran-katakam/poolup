import Link from "next/link";

// Seat pip from the pools list: filled = someone in that seat.
function Seat() {
  return <span className="h-3.5 w-[22px] rounded-[3px_3px_6px_6px] border-2 border-yellow bg-yellow" />;
}

export default function Home() {
  return (
    <>
      <h1 className="font-display text-[40px] font-bold leading-none tracking-[0.01em] text-balance">
        Going to the city? Split the auto.
      </h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">
        An auto from campus to Vijayawada costs about ₹400 alone. Find batchmates leaving at the same time and share it.
      </p>

      <div className="mt-6 grid grid-cols-[1fr_auto_1.3fr] items-stretch overflow-hidden rounded-[10px] border border-line bg-white">
        <div className="flex flex-col justify-center p-4">
          <span className="text-xs font-semibold tracking-[0.12em] text-muted">ALONE</span>
          <span className="mt-1 font-mono text-[28px] font-bold text-muted line-through decoration-2">₹400</span>
        </div>
        <div aria-hidden="true" className="flex items-center pr-3 font-display text-2xl font-bold">→</div>
        <div className="flex flex-col items-center justify-center bg-ink px-3 py-4 text-yellow">
          <span className="font-mono text-[40px] font-bold leading-none">₹100</span>
          <span className="mt-1.5 text-[11px] tracking-[0.14em] text-white">EACH, 4 SHARING</span>
          <span className="mt-2.5 flex gap-1.5" aria-hidden="true">
            <Seat /><Seat /><Seat /><Seat />
          </span>
        </div>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed">
        Post where you&apos;re going and when, or join a pool that&apos;s already leaving. Only verified VIT-AP emails get in.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/login" className="btn">Log in</Link>
        <Link href="/register" className="btn btn-outline">Create account</Link>
      </div>
    </>
  );
}
