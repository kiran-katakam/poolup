# PoolUp

Live site: https://poolup.kirankatakam.me

PoolUp is a web app where VIT-AP students find others going the same way and split an auto. Phases 1 to 4 are shipped: pooling, pool chat, women-only pools and Google sign-in. Phases 5 and 6 are listed below as next.

## The problem

VIT-AP is about 18 km outside Vijayawada. An auto from campus to the bus stand, railway station or airport costs about ₹400 alone. Students look for company in scattered WhatsApp groups ("anyone going to the station at 4?"), and there is no single place that shows every pool on a route.

## Who it is for

VIT-AP students (`@vitapstudent.ac.in`) travelling between campus and five city spots: Vijayawada Bus Stand, Vijayawada Railway Station, Gannavaram Airport, PVP Square, Trendset Mall. Staff with `@vitap.ac.in` emails can also sign up.

## What Phase 1 does

- Register with a college email and a one-time code (OTP) sent to that inbox. Log in with email and password after that. "Forgot password?" on the login page (and "Change password" on the Account page) emails a 6-digit code and sets a new password.
- Create a pool: from, to, a departure window of up to 3 hours (up to 7 days ahead), 2 to 5 seats, estimated total fare (default ₹400).
- Browse pools, filter by start, destination and date. Each pool shows seats left and the per-person fare.
- Join, leave, cancel (creator only). One active pool per student. Pools expire after their departure window.
- Sharing your WhatsApp number is a choice per pool (on by default). Members see only the numbers that were shared, with a WhatsApp button.

## Phase 2: pool chat

- Members of a pool get a chat on the pool page, so they can plan the meeting point without sharing a number. Non-members can't read or post. Once the pool is cancelled or departed, the chat is read-only.

## Phase 3: women-only pools

- Pick your gender once when you sign up (OTP or Google); it can't be changed later. A woman can tick "Women only" when she creates a pool; the pool shows a "Women only" badge, and only women can see or join it. For anyone else it is hidden and answers 404.
- `demo2@vitapstudent.ac.in` is the female demo account, so use it to try women-only pools. `demo1` and `demo3` have no gender set.
- The Account page (top right) lets you edit your name and WhatsApp number, shows your email and gender read-only, and has the Log out button.

## Phase 4: Google sign-in

- "Continue with Google" on the login and register pages, for Google accounts with a college email only. An existing account logs straight in. A new one adds a WhatsApp number, gender and password on a "Finish your profile" page, with no OTP. The password lets them log in by email too.

## Try it (2 minutes)

The seed adds four sample pools run by seed-only "(demo)" accounts, one of them women-only (only `demo2` can see it). Those accounts can't log in. The pools depart soon after seed time and are deleted 1 day after their departure window, so you may need to create a pool yourself. `demo1` to `demo3` start in no pool, so this path works either way:

1. Open the live site and log in as `demo1@vitapstudent.ac.in`. The password is shown on the login page.
2. Create a pool.
3. In a private window, log in as `demo2@vitapstudent.ac.in`, open the pool and join it, with number sharing on, then try off.
4. Watch the ₹ each figure drop as people join, and the WhatsApp button appear for members who shared.
5. Send a chat message from one window and watch it show up in the other.

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
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud, see below. Optional: without it the Google button sends you back to login with an error, and everything else works. |
| `GOOGLE_CLIENT_SECRET` | The secret of the same OAuth client. |

### Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project, then open APIs & Services, OAuth consent screen, and set it up as External with the app name and your email.
2. Under Credentials, create an OAuth client ID of type Web application.
3. Add these authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` and `https://<your-domain>/api/auth/google/callback`.
4. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. Publish the consent screen. In Testing mode only the test users you list can sign in.

### Deploy to Vercel

Import the repo, add the variables above (eight with Google sign-in), and deploy. `NEXT_PUBLIC_DEMO_PASSWORD` must be set before the build, because Next inlines it at build time. Run `npm run seed` once against the same Atlas database.

## Known limitations

- The OTP email may land in spam on the college mail server. The register page tells users to check spam.
- Resend's free tier is 100 emails a day. OTP requests are limited per email only, so someone could use made-up college addresses to use up that daily quota.
- Two people tapping Join on two different pools at the same moment could end up in both. Fixing it needs a database transaction.
- No brute-force limit on login.
- Asking for a code for an already registered email says so, which reveals that the email has an account.
- Cancel has no check that the pool is still open, so cancelling twice succeeds, and an expired pool can be marked cancelled.
- Google sign-in only works on https://poolup.kirankatakam.me (the redirect URI registered with Google), not on the *.vercel.app host.
- Seeded sample pools expire. Run `npm run seed` again, or create fresh ones to demo.
- No end-to-end browser tests (see `TESTING.md`).
- Default Next.js favicon; all pool pages share the title "PoolUp".
- Chat polls every 2 s, so a new message can take up to about 2 s to show up.
- No rate limit on chat messages.
- Pools and their chat messages are deleted 1 day after the departure window ends.
- Gender is self-declared, with no verification.
- Gender can't be changed after sign-up. Accounts made before this rule (like `demo1` and `demo3`) show "Not set" and count as not female.
- Reviewers can't try Google sign-in without a college Google account; it is shown in the demo video instead.
- Google accounts made before sign-up asked for a password have none; they can set one with "Forgot password?".
- Not built yet: match alerts, auto queue.

## Next

- Phase 5: match alerts by email
- Phase 6: auto queue for drivers and an admin

## Testing

See `TESTING.md`. The write-up for the submission is `WRITEUP.md`.

## Attribution

- Scaffolded with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
- Fonts: [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) and [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono) from Google Fonts, loaded with `next/font/google` (SIL Open Font License).
- Built with Next.js, React, Tailwind CSS, Mongoose, Zod, jose, bcryptjs, Resend and Vitest.
