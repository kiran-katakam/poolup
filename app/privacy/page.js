import Link from "next/link";

export const metadata = { title: "Privacy Policy · PoolUp" };

const h2 = "mt-8 font-display text-2xl font-bold";
const p = "mt-2 text-[15px] leading-relaxed";
const ul = "mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="font-display text-[34px] font-bold leading-none lg:text-[44px]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated 24 October 2026</p>

      <p className={p}>
        PoolUp is a student project that helps VIT-AP students share autos. This page says what we store, why, who can
        see it, and how long we keep it. It is not run by or affiliated with VIT-AP University.
      </p>

      <h2 className={h2}>What we store</h2>
      <ul className={ul}>
        <li><strong>Account:</strong> your college email, full name, nickname, WhatsApp number and gender.</li>
        <li><strong>Password:</strong> only a one-way hash (bcrypt). We can&apos;t see your password.</li>
        <li><strong>Google sign-in:</strong> only your email and name from Google. We don&apos;t get access to your Google account.</li>
        <li><strong>Pools:</strong> the pools you create or join: places, times, seats, fare, and whether you shared your number.</li>
        <li><strong>Chat:</strong> messages you send in a pool chat.</li>
        <li><strong>Sign-up and reset codes:</strong> a hash of the 6-digit code, deleted after 10 minutes or once used.</li>
      </ul>
      <p className={p}>We don&apos;t use analytics, ads or tracking, and we don&apos;t sell or share your data for marketing.</p>

      <h2 className={h2}>Who sees what</h2>
      <ul className={ul}>
        <li>Any logged-in student sees open pools with the members&apos; nicknames. Women-only pools are shown only to women and to their members.</li>
        <li>Pool members see the pool chat, and the WhatsApp number of members who chose to share it with that pool.</li>
        <li>Your full name, email and gender are shown only to you, on your Account page. Your gender decides whether you can see women-only pools.</li>
        <li>Someone who saw your shared number may have saved it, even after you turn sharing off.</li>
      </ul>

      <h2 className={h2}>How long we keep it</h2>
      <ul className={ul}>
        <li>Pools and their chat messages are deleted automatically 1 day after the pool&apos;s departure time.</li>
        <li>Your account stays until you ask us to delete it.</li>
      </ul>

      <h2 className={h2}>Cookies</h2>
      <p className={p}>We use only the cookies needed to log you in:</p>
      <ul className={ul}>
        <li><code className="font-mono text-sm">session</code>: keeps you logged in for 7 days.</li>
        <li><code className="font-mono text-sm">google_state</code> and <code className="font-mono text-sm">google_signup</code>: used during Google sign-in, expire within 15 minutes.</li>
      </ul>

      <h2 className={h2}>Services we use</h2>
      <ul className={ul}>
        <li><strong>MongoDB Atlas</strong> stores the database.</li>
        <li><strong>Vercel</strong> hosts the website.</li>
        <li><strong>Resend</strong> sends the sign-up and password reset emails.</li>
        <li><strong>Google</strong> handles &quot;Continue with Google&quot; if you use it.</li>
      </ul>

      <h2 className={h2}>Your choices</h2>
      <ul className={ul}>
        <li>Edit your nickname, full name and WhatsApp number on the Account page.</li>
        <li>Turn number sharing off for any pool from the pool page.</li>
        <li>Ask for a copy of your data, a correction, or deletion of your account through the contact below.</li>
      </ul>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        Open an issue on the{" "}
        <a href="https://github.com/kiran-katakam/poolup/issues" className="link" target="_blank" rel="noopener noreferrer">PoolUp GitHub page</a>.
        If this policy changes, the date at the top changes too. See also the <Link href="/terms" className="link">Terms of Service</Link>.
      </p>
    </article>
  );
}
