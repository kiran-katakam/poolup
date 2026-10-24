import Link from "next/link";

export const metadata = { title: "Terms of Service · PoolUp" };

const h2 = "mt-8 font-display text-2xl font-bold";
const p = "mt-2 text-[15px] leading-relaxed";
const ul = "mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="font-display text-[34px] font-bold leading-none lg:text-[44px]">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated 24 October 2026</p>

      <p className={p}>
        PoolUp helps VIT-AP students find others going the same way so they can share an auto. By creating an account
        or using PoolUp, you agree to these terms. PoolUp is a student project and is not run by or affiliated with
        VIT-AP University.
      </p>

      <h2 className={h2}>Who can use it</h2>
      <ul className={ul}>
        <li>You need a college email ending in @vitapstudent.ac.in or @vitap.ac.in that belongs to you.</li>
        <li>One account per person. Keep your password to yourself; you are responsible for what happens on your account.</li>
        <li>Give your real gender at sign-up. It decides who can see women-only pools, and it can&apos;t be changed later.</li>
      </ul>

      <h2 className={h2}>What PoolUp does and doesn&apos;t do</h2>
      <ul className={ul}>
        <li>PoolUp only lists pools and lets members talk. It doesn&apos;t provide autos, drivers or rides, and it isn&apos;t a party to any trip.</li>
        <li>Fares shown are estimates. The auto driver sets the real price, and members settle it among themselves.</li>
        <li>We don&apos;t verify anyone beyond their college email. Gender is self-declared.</li>
      </ul>

      <h2 className={h2}>Your safety</h2>
      <ul className={ul}>
        <li>You decide whether to join a pool and whether to travel. Meet in public places, like the main gate.</li>
        <li>If something feels wrong, don&apos;t get in. In an emergency, call 112.</li>
      </ul>

      <h2 className={h2}>Rules</h2>
      <p className={p}>Don&apos;t:</p>
      <ul className={ul}>
        <li>Post fake pools, or create pools you don&apos;t plan to take.</li>
        <li>Harass, threaten or spam other students, in chat or on WhatsApp.</li>
        <li>Lie about your gender to get into women-only pools.</li>
        <li>Use other people&apos;s numbers or details for anything other than the trip.</li>
        <li>Try to break, overload or get around the limits of the app.</li>
      </ul>
      <p className={p}>We may remove pools or messages, or suspend accounts, that break these rules.</p>

      <h2 className={h2}>No guarantees</h2>
      <p className={p}>
        PoolUp is provided as is, for free. It may be down, slow or change without notice. As far as the law allows, we
        aren&apos;t responsible for trips, fares, missed rides, lost items, or anything that happens between people who
        met through PoolUp.
      </p>

      <h2 className={h2}>Changes and contact</h2>
      <p className={p}>
        If these terms change, the date at the top changes too, and using PoolUp after that means you accept them.
        Questions? Open an issue on the{" "}
        <a href="https://github.com/kiran-katakam/poolup/issues" className="link" target="_blank" rel="noopener noreferrer">PoolUp GitHub page</a>.
        How we handle your data is in the <Link href="/privacy" className="link">Privacy Policy</Link>.
      </p>
    </article>
  );
}
