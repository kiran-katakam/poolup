import Link from "next/link";
import { PLACES } from "@/lib/places.js";
import { Seats } from "@/app/components/PoolCard";

// The fare for one ₹400 auto split 1 to 4 ways, rounded up like the app does.
const SPLITS = [1, 2, 3, 4].map((people) => ({ people, each: Math.ceil(400 / people) }));

const STEPS = [
  { title: "Post or find a pool", text: "Pick where you're leaving from, where you're going, and a time window of up to 3 hours." },
  { title: "Fill the seats", text: "Batchmates going the same way join, and the fare per head drops with each one." },
  { title: "Meet at the gate", text: "Sort out the details in the pool chat, or on WhatsApp with members who shared their number." },
];

const FEATURES = [
  { title: "Verified students only", text: "Sign up with your college email and a one-time code, or Google with your college account." },
  { title: "Women-only pools", text: "Women can make pools that only other women can see or join." },
  { title: "Your number, your call", text: "Share your WhatsApp number with a pool, or keep it hidden and use the chat." },
  { title: "One pool at a time", text: "Nobody holds seats in three pools just in case, so the list stays real." },
];

function FareDrop() {
  return (
    <figure className="overflow-hidden rounded-[10px] border border-line bg-white">
      <figcaption className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 lg:px-6">
        <span className="font-display text-[21px] font-bold leading-tight">Campus → Railway Stn</span>
        <span className="font-mono text-[13px] text-muted">₹400 auto</span>
      </figcaption>
      <ul>
        {SPLITS.map(({ people, each }) => {
          const best = people === 4;
          return (
            <li key={people}
              className={`flex items-center justify-between gap-4 px-4 py-3 lg:px-6 ${best ? "bg-ink text-white" : "border-b border-line"}`}>
              <span className="flex items-center gap-3">
                <Seats taken={people} capacity={4} tone={best ? "yellow" : undefined} />
                <span className="text-[15px]">{people === 1 ? "Alone" : `${people} sharing`}</span>
              </span>
              <span className={`font-mono text-[28px] font-bold tabular-nums ${best ? "text-yellow" : people === 1 ? "text-muted line-through decoration-2" : ""}`}>
                ₹{each}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-6 lg:gap-24">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-6">
        <div>
          <h1 className="font-display text-[44px] font-bold leading-[0.95] text-balance sm:text-[56px] lg:text-[72px]">
            Going to the city? Split the auto.
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted lg:text-[19px]">
            An auto from VIT-AP to Vijayawada costs about ₹400 alone. PoolUp shows every batchmate leaving around the same time, so four of you pay ₹100 each.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="btn sm:w-auto sm:px-8">Create account</Link>
            <Link href="/login" className="btn btn-outline sm:w-auto sm:px-8">Log in</Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            For @vitapstudent.ac.in and @vitap.ac.in emails. Just looking? Demo accounts are on the log in page.
          </p>
        </div>
        <FareDrop />
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-[34px] font-bold leading-none lg:text-[44px]">How it works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-t-2 border-ink pt-4">
              <span className="font-mono text-[15px] font-bold">{i + 1}</span>
              <h3 className="mt-1 font-display text-2xl font-bold">{step.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="campus-heading" className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <h2 id="campus-heading" className="font-display text-[34px] font-bold leading-none lg:text-[44px]">Made for one campus</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            About 14,000 students, two buses a day, and no single WhatsApp group. Every pool on PoolUp is a VIT-AP student going somewhere students actually go.
          </p>
        </div>
        <dl className="grid gap-x-8 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-b border-line py-4">
              <dt className="font-display text-xl font-bold">{f.title}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-muted">{f.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="places-heading">
        <h2 id="places-heading" className="font-display text-[34px] font-bold leading-none lg:text-[44px]">Six places, both ways</h2>
        <p className="mt-3 text-[15px] text-muted">Any place can be the start or the end, so getting back to campus works too.</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {PLACES.map((p) => (
            <li key={p.id} className="rounded-lg border-2 border-ink bg-white px-3 py-1.5 font-display text-lg font-bold">{p.label}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-5 rounded-[10px] bg-ink p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-12">
        <div>
          <h2 className="font-display text-[34px] font-bold leading-none text-yellow lg:text-[44px]">Leaving campus today?</h2>
          <p className="mt-2 text-[15px] text-white">See who&apos;s already going before you pay ₹400 alone.</p>
        </div>
        <Link href="/register" className="btn shrink-0 bg-yellow text-ink hover:bg-white sm:w-auto sm:px-8">Find a pool</Link>
      </section>
    </div>
  );
}
