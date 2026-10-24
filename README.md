# PoolUp

**Find VIT-AP batchmates going your way and split the auto fare.**

**Live:** https://poolup.kirankatakam.me · **Docs:** [Architecture](ARCHITECTURE.md) · [Test plan](TESTING.md)

PoolUp is a web app for VIT-AP University students to share auto-rickshaw rides between campus and Vijayawada. A student posts where they are going and when, others going the same way join, and the fare per person drops as the auto fills: ₹400 alone, ₹200 for two, ₹134 for three, ₹100 for four. Every account is a verified college email, so you know everyone in a pool is a fellow student.

---

## The problem

VIT-AP's campus is about 18 km outside Vijayawada, with two buses a day that are full every time. The only other way into the city is an auto, which costs about ₹400 alone and about ₹100 each when four people share it.

Finding people to share with comes down to luck. Students ask in scattered WhatsApp groups ("anyone going to the station at 4?"), and with around 14,000 students and no single group, most never learn that someone else was leaving ten minutes later. The fix is not more autos. It is one place where every trip leaving or returning to campus is visible.

## Who it is for

- **VIT-AP students** with an `@vitapstudent.ac.in` email, travelling between campus and the city: weekend outings, going home for holidays, and coming back on Sunday nights or after breaks.
- **VIT-AP staff** with an `@vitap.ac.in` email can also sign up.

It is built for phones first, since it is usually opened from a WhatsApp link on the way to the gate, and works on laptops too.

## Features

**Accounts**
- Sign up with a college email and a 6-digit code sent to that inbox, or with "Continue with Google" using a college Google account.
- Log in with email and password. "Forgot password?" resets it with an emailed code.
- Other students see a nickname, taken from your email by default (`kiran.23bce7123@…` shows as "Kiran") and editable on the Account page. Your full name stays private.

**Pools**
- Create a pool: from and to (one end is always VIT-AP Campus), a departure window of up to 3 hours within the next 7 days, 2 to 5 seats, and an estimated total fare (₹400 by default).
- Browse open pools filtered by start, destination and day. Each shows seats left and the live fare per person.
- Join, leave, or cancel (creator only). A student can be in one active pool at a time.
- Places: VIT-AP Campus, Vijayawada Bus Stand, Vijayawada Railway Station, Gannavaram Airport, PVP Square, Trendset Mall.

**Coordinating**
- A chat inside each pool, for its members only. It becomes read-only once the pool is cancelled or has departed.
- Optional WhatsApp number sharing, chosen per pool. Members see a WhatsApp button only for people who shared.

**Safety and privacy**
- Women-only pools: a woman can mark her pool women-only, and only women can see or join it. Gender is chosen once at sign-up and can't be changed later.
- Pools and their chat are deleted automatically 1 day after departure.
- [Terms of Service](https://poolup.kirankatakam.me/terms) and [Privacy Policy](https://poolup.kirankatakam.me/privacy) pages.

## Try it

Real sign-up needs a college inbox, so the live site has four demo accounts. They are listed on the login page with their shared password and a one-tap "Fill" button.

| Account | Gender |
|---|---|
| `demo1@vitapstudent.ac.in` | Male |
| `demo2@vitapstudent.ac.in` | Female |
| `demo3@vitapstudent.ac.in` | Male |
| `demo4@vitapstudent.ac.in` | Female |

A two-minute walkthrough:

1. Log in as `demo1` and create a pool.
2. In a private window, log in as `demo2`, open that pool and join it. The fare per person drops.
3. Send a chat message from one window and watch it appear in the other.
4. As `demo2` or `demo4`, create a women-only pool, then check that `demo1` can't see it.

The seed also adds sample pools run by "(demo)" accounts. They depart soon after seeding and are deleted a day later, so you may need to create a pool yourself.

## Tech stack

| Layer | Choice |
|---|---|
| App | [Next.js 16](https://nextjs.org) (App Router, JavaScript): pages and API routes in one project |
| Database | MongoDB Atlas with Mongoose |
| Auth | bcryptjs for hashing and jose for signed session cookies; Google OAuth written with `fetch` and jose |
| Validation | Zod |
| Email | Resend |
| Styling | Tailwind CSS |
| Tests | Vitest |
| Hosting | Vercel |

How it all fits together, what every file does, and why each choice was made are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Getting started

### Prerequisites

- Node.js 22 or newer (the seed script uses `node --env-file`)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A [Resend](https://resend.com) account and API key
- Optional: a Google Cloud OAuth client, for Google sign-in

### Install and run

```bash
git clone https://github.com/kiran-katakam/poolup.git
cd poolup
npm install
cp .env.example .env     # fill in the values below
npm run seed             # creates the demo accounts and sample pools
npm run dev              # http://localhost:3000
```

### Environment variables

| Variable | Value |
|---|---|
| `MONGODB_URI` | Atlas connection string. In Atlas Network Access, allow `0.0.0.0/0` (Vercel has no fixed IP). The database name `poolup` is set in code. |
| `JWT_SECRET` | A long random string, for example from `openssl rand -base64 32`. Signs session cookies. |
| `RESEND` | Resend API key. Emailing real college addresses needs a verified sending domain. |
| `EMAIL_FROM` | Sender, for example `PoolUp <noreply@your-domain>`. Resend's default `onboarding@resend.dev` only delivers to your own Resend account address. |
| `DEMO_PASSWORD` | Password for the seeded demo accounts. |
| `NEXT_PUBLIC_DEMO_PASSWORD` | The same value, shown on the login page. |
| `GOOGLE_CLIENT_ID` | Optional. Google OAuth client ID. Without it, the Google button returns to the login page with an error and everything else works. |
| `GOOGLE_CLIENT_SECRET` | Optional. The secret of the same OAuth client. |

### Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and set up the OAuth consent screen as External.
2. Under Credentials, create an OAuth client ID of type **Web application**.
3. Add the authorized redirect URIs `http://localhost:3000/api/auth/google/callback` and `https://<your-domain>/api/auth/google/callback`.
4. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. Publish the consent screen. In Testing mode, only the test users you list can sign in.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Run the unit tests |
| `npm run lint` | Run ESLint |
| `npm run seed` | Create or refresh the demo accounts and sample pools |

### Deploy

Import the repository into [Vercel](https://vercel.com), add the environment variables above, and deploy. Set `NEXT_PUBLIC_DEMO_PASSWORD` before the first build, because Next.js inlines it at build time. Then run `npm run seed` once against the same Atlas database.

## Testing

`npm test` runs 93 unit tests covering the business rules (college email check, fare split, one-pool rule, pool expiry, women-only visibility, nicknames), every input schema, session tokens and the email template. Flows that need a browser are covered by the manual test plan in [TESTING.md](TESTING.md).

## Known limitations

**Abuse and security**
- No brute-force limit on login.
- Code requests are limited per email address, not per IP, so made-up college addresses could use up Resend's free quota of 100 emails a day.
- No rate limit on chat messages.
- Asking for a code for a registered email (or a reset for an unregistered one) says so, which reveals whether that email has an account.

**Trust**
- Gender is self-declared. A college email proves someone is a student, not their gender.
- Fares are estimates. The auto driver sets the real price.

**Behaviour**
- Two Join taps on two different pools at the same instant could put a student in both. Fixing it needs a database transaction.
- Cancel doesn't check that the pool is still open, so cancelling twice succeeds and an expired pool can be marked cancelled.
- Chat checks for new messages every 2 seconds, so messages can take up to 2 seconds to appear.
- Pools and their chat are deleted 1 day after departure, so seeded sample pools disappear. Run `npm run seed` again or create new pools.
- Accounts created before gender was required show "Not set" and can't see women-only pools. Older Google-only accounts have no password until they use "Forgot password?".

**Environment**
- Code emails may land in the college mail server's spam folder. The sign-up page says to check spam.
- Google sign-in only works on the domain registered with Google (https://poolup.kirankatakam.me), not on the `*.vercel.app` preview address. Trying it also needs a college Google account.
- No end-to-end browser tests.
- The default Next.js favicon, and every pool page shares the title "PoolUp".

## Roadmap

- **Match alerts:** save a route and time, get an email when a matching pool is created.
- **Auto queue:** drivers and an admin manage the serial-order auto queue at the campus gate, and students see which auto is next and how full it is.

## Attribution

- Scaffolded with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
- Fonts: [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) and [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono) from Google Fonts, via `next/font/google` (SIL Open Font License).
- Built with Next.js, React, Tailwind CSS, Mongoose, Zod, jose, bcryptjs, Resend and Vitest.
