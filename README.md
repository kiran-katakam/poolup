# PoolUp

Live site: LIVE_URL_TBD

PoolUp is a web app where VIT-AP students find others going the same way and split an auto. Phase 1 is shipped. Phases 2 to 6 are listed below as next.

## The problem

VIT-AP is about 18 km outside Vijayawada. An auto from campus to the bus stand, railway station or airport costs about ₹400 alone. Students look for company in scattered WhatsApp groups ("anyone going to the station at 4?"), and there is no single place that shows every pool on a route.

## Who it is for

VIT-AP students (`@vitapstudent.ac.in`) travelling between campus and five city spots: Vijayawada Bus Stand, Vijayawada Railway Station, Gannavaram Airport, PVP Square, Trendset Mall. Staff with `@vitap.ac.in` emails can also sign up.

## What Phase 1 does

- Register with a college email and a one-time code (OTP) sent to that inbox. Log in with email and password after that.
- Create a pool: from, to, a departure window of up to 3 hours (up to 7 days ahead), 2 to 5 seats, estimated total fare (default ₹400).
- Browse pools, filter by start, destination and date. Each pool shows seats left and the per-person fare.
- Join, leave, cancel (creator only). One active pool per student. Pools expire after their departure window.
- Sharing your WhatsApp number is a choice per pool (on by default). Members see only the numbers that were shared, with a WhatsApp button.

## Try it (2 minutes)

The seed adds three sample pools run by seed-only "(demo)" accounts, so the list shows the ₹ each figure at ₹134, ₹200 and ₹400. Those accounts can't log in. The pools are dated from seed time, so they may have departed by the time you read this. `demo1` to `demo3` start in no pool, so this path works either way:

1. Open the live site and log in as `demo1@vitapstudent.ac.in`. The password is shown on the login page.
2. Create a pool.
3. In a private window, log in as `demo2@vitapstudent.ac.in`, open the pool and join it, with number sharing on, then try off.
4. Watch the ₹ each figure drop as people join, and the WhatsApp button appear for members who shared.

Real sign-up needs a college inbox, so reviewers should use the demo accounts. `demo3@vitapstudent.ac.in` also exists if you want a third member.

## Setup

Needs Node 22 (the seed script uses `node --env-file`).

```bash
git clone https://github.com/kiran-katakam/poolup.git
cd poolup
npm install
cp .env.example .env     # then fill it in, see below
npm run seed             # demo1-3 logins plus sample pools by seed-only accounts
npm run dev              # http://localhost:3000
npm test                 # unit tests
```

Fill in `.env`:

| Variable | What to put |
|---|---|
| `MONGODB_URI` | Connection string from a free MongoDB Atlas cluster. In Atlas, Network Access, allow `0.0.0.0/0` (Vercel has no fixed IP). The database name `poolup` is set in code. |
| `RESEND` | A Resend API key. To email real college addresses you need a verified sending domain in Resend. |
| `EMAIL_FROM` | Sender, for example `PoolUp <noreply@your-domain>`. The default `onboarding@resend.dev` only delivers to your own Resend account address. |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `DEMO_PASSWORD` | Password for the seeded demo accounts. |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Same value. It is shown on the login page for reviewers. |

### Deploy to Vercel

Import the repo, add all six variables above, and deploy. `NEXT_PUBLIC_DEMO_PASSWORD` must be set before the build, because Next inlines it at build time. Run `npm run seed` once against the same Atlas database.

## Known limitations

- The OTP email may land in spam on the college mail server. The register page tells users to check spam.
- Resend's free tier is 100 emails a day. OTP requests are limited per email only, so someone could use made-up college addresses to use up that daily quota.
- Two people tapping Join on two different pools at the same moment could end up in both. Fixing it needs a database transaction.
- No brute-force limit on login.
- Asking for a code for an already registered email says so, which reveals that the email has an account.
- Cancel has no check that the pool is still open, so cancelling twice succeeds, and an expired pool can be marked cancelled.
- Seeded sample pools expire. Run `npm run seed` again, or create fresh ones to demo.
- No end-to-end browser tests (see `TESTING.md`).
- Default Next.js favicon; all pool pages share the title "PoolUp".
- Not built yet: chat, women-only pools, Google sign-in, match alerts, auto queue.

## Next

- Phase 2: live chat per pool
- Phase 3: women-only pools
- Phase 4: Google sign-in (college accounts only)
- Phase 5: match alerts by email
- Phase 6: auto queue for drivers and an admin

## Testing

See `TESTING.md`. The write-up for the submission is `WRITEUP.md`.

## Attribution

- Scaffolded with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
- Fonts: [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) and [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono) from Google Fonts, loaded with `next/font/google` (SIL Open Font License).
- Built with Next.js, React, Tailwind CSS, Mongoose, Zod, jose, bcryptjs, Resend and Vitest.
