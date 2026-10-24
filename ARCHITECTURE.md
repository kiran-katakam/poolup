# PoolUp: Architecture and Decisions

How PoolUp works from the browser to the database, what every file does, and every decision taken while building it, with the reason for each.

Last updated 24 October 2026.

**Contents**

1. [What PoolUp is](#1-what-poolup-is)
2. [System overview](#2-system-overview)
3. [How a request flows](#3-how-a-request-flows)
4. [Key flows end to end](#4-key-flows-end-to-end)
5. [Data model](#5-data-model)
6. [Auth, sessions and cookies](#6-auth-sessions-and-cookies)
7. [Business rules](#7-business-rules)
8. [API reference](#8-api-reference)
9. [Frontend: every page and component](#9-frontend-every-page-and-component)
10. [Backend: every server file](#10-backend-every-server-file)
11. [Tooling, scripts and config](#11-tooling-scripts-and-config)
12. [Decision log](#12-decision-log)
13. [Security summary](#13-security-summary)
14. [Known limitations](#14-known-limitations)

---

## 1. What PoolUp is

VIT-AP's campus is about 18 km outside Vijayawada, with two buses a day. A solo auto costs about ₹400; shared by four it is about ₹100 each. PoolUp is one place where VIT-AP students see who is going the same way at the same time, join them, and split the fare.

Features, in the order they were built:

| Phase | Feature |
|---|---|
| 1 | College-email sign-up with a one-time code (OTP), password login, create / browse / join / leave / cancel pools, one active pool per student, live per-person fare, opt-in WhatsApp number sharing, seeded demo accounts |
| 2 | Pool chat for members, polling every 2 s, read-only once the pool ends; pools and chat deleted 1 day after departure |
| 3 | Women-only pools, gender chosen once at sign-up |
| 4 | "Continue with Google" for college Google accounts |
| After | Account page, password reset, nicknames, campus-only routes, landing page, laptop layout, Terms and Privacy pages, themed email |

---

## 2. System overview

```
            ┌──────────────────────────────── Vercel (one Next.js 16 app) ───────────────────────────────┐
            │                                                                                              │
 Browser ──►│  proxy.js ──► Pages (app/**/page.js, React)        API routes (app/api/**/route.js)           │
 (phone or  │  redirects     render the UI, call the API ──fetch──► check session ► validate (zod)          │
  laptop)   │  by cookie     through lib/client.js                 ► rules (lib/rules.js) ► Mongoose ───────┼──► MongoDB Atlas
            │                                                                                     │        │     (users, otps,
            │                                                                                     ├────────┼──►   pools, messages)
            │                                                                                     │        │
            │                                                                                     ├────────┼──► Resend (OTP emails)
            │                                                                                     └────────┼──► Google OAuth (sign-in)
            └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Part | Choice |
|---|---|
| App | Next.js 16 App Router, JavaScript. Pages and API in one project, one deploy. `cacheComponents: true`. |
| Database | MongoDB Atlas (free M0) through Mongoose 9, database name `poolup` |
| Hosting | Vercel Hobby, auto-deploys from GitHub `main` |
| Email | Resend, from a verified own domain |
| Auth | Hand-written: bcryptjs (hashing) + jose (signed JWT in an httpOnly cookie); Google OAuth with `fetch` + jose |
| Validation | zod 4 |
| Styling | Tailwind CSS 4 with design tokens in `app/globals.css` |
| Tests | Vitest (pure functions and schemas) |

There is no separate backend server, no cron job and no websocket service. Expiry is computed when data is read, and old data is removed by MongoDB TTL indexes.

---

## 3. How a request flows

### Loading a page

1. **`proxy.js`** runs first for page routes (`/`, `/login`, `/register`, `/finish-profile`, `/pools/*`, `/account`). It verifies the `session` cookie's signature (no database call):
   - logged in and opening a logged-out page (`/`, `/login`, `/register`, `/finish-profile`) → redirect to `/pools`
   - logged out and opening an app page (`/pools*`, `/account`) → redirect to `/login`
   - `/forgot-password`, `/terms` and `/privacy` are outside the matcher, so they work either way.
2. **`app/layout.js`** renders the shell: the `Nav` bar, `<main>` and the footer.
3. The **page** (a client component) renders straight away, then loads its data with `api()` from `lib/client.js`.

### Calling the API

Every API route follows the same steps, in this order:

1. **Who is asking:** `getUser(request)` (`lib/auth.js`) reads the `session` cookie, verifies the JWT, and loads the user. No user → `unauthorized()` (401, and the cookie is cleared).
2. **Is the input valid:** the body goes through a zod schema with `parseBody(schema, body)` (`lib/validation.js`), which returns `{ data }` or `{ error }` and never throws. Error → `fail(400, message)`.
3. **Is it allowed:** pure rule functions from `lib/rules.js` decide (can this user see the pool, join it, post in its chat).
4. **Do it:** Mongoose reads or writes. Writes that could race (joining the last seat) are single atomic updates.
5. **Answer:** JSON built by `toPoolJSON` / `toMessageJSON` (`lib/pools.js`), which decide exactly which fields leave the server. Errors are `{ error: "plain sentence" }` with a fitting status code. Unexpected errors are logged and answer 500 "Something went wrong, try again".

On the browser side, `api()` always returns `{ ok, status, data }`, even on a network failure, so every page handles one shape: `if (r.ok) … else show r.data.error`.

---

## 4. Key flows end to end

### Sign up with email and code

```
/register (step 1: email) ──POST /api/auth/request-otp {email, purpose:"register"}
   server: college domain? (zod) → email not registered? (409) → 60 s since last code? (429)
           → save bcrypt hash of a random 6-digit code, expires in 10 min → send themed email (Resend)
/register (step 2: code, name, phone, gender, password) ──POST /api/auth/register
   server: checkOtp (claims one of 5 attempts atomically, compares hash) → create user
           (bcrypt password hash) → delete code → set session cookie → 201
browser → /pools
```

### Sign in with Google

```
GoogleButton → GET /api/auth/google
   server: random state → httpOnly google_state cookie (10 min) → redirect to Google
Google → GET /api/auth/google/callback?code&state
   server: state matches cookie? → exchange code for tokens (fetch) → verify id_token with
           Google's public keys (jose: signature, audience, issuer, expiry)
           → email verified and a college address? (googleAccountError)
           ├─ user exists → session cookie → /pools
           └─ new → signed google_signup cookie {email, name} (15 min) → /finish-profile
/finish-profile ── GET /api/auth/google/pending (prefill name)
               ── POST /api/auth/google/complete {name, phone, gender, password}
   server: verify google_signup cookie → create user (email only from the signed cookie)
           → clear cookie → session cookie → /pools
```

### Log in, log out, reset password

- **Log in:** `POST /api/auth/login` compares the password with bcrypt. Unknown email and wrong password give the same 401 "Wrong email or password"; an unknown email is compared against a dummy hash so timing doesn't reveal which. Accounts with no password (old Google-only ones) are refused the same way.
- **Log out:** button on `/account` → `POST /api/auth/logout` clears the cookie.
- **Reset password:** `/forgot-password` → `POST /api/auth/request-otp {purpose:"reset"}` (needs an existing account) → `POST /api/auth/reset-password {email, otp, password}` → same `checkOtp` → new bcrypt hash → logged in.

### Create, browse, join, leave, cancel

- **Browse:** `/pools` → `GET /api/pools?from&to&date`. Only open pools whose window hasn't ended, earliest first. Women-only pools are filtered out unless the viewer is female. The list never includes phone numbers.
- **Create:** `/pools/new` → `POST /api/pools`. zod checks places (different, one end is campus), window (end after start, at most 3 h, not past, start within 7 days), seats 2–5, fare ₹50–5000. Then: not already in an active pool (409); women-only only for women (403). The creator becomes `members[0]`.
- **Join:** `POST /api/pools/:id/join`. `joinBlockReason` gives a clear 409 message (cancelled, expired, full, already a member, already in another pool), then one atomic `findOneAndUpdate` adds the member only while a seat is free. If two people tap the last seat, one gets "This pool just filled or closed".
- **Leave / cancel:** members leave (`/leave`), the creator cancels (`/cancel`, status becomes `cancelled`).
- **Number sharing:** chosen when creating or joining, changeable later with `POST /api/pools/:id/share`. Members see WhatsApp buttons only for members who shared.

### Chat

`Chat` (on `/pools/[id]`, members only) polls `GET /api/pools/:id/messages` every 2 s while the tab is visible and the pool is active. It stops on 401/403 (left the pool) and when the pool ends. `POST` sends a message (1–500 characters). After the pool is cancelled or departs, the chat is read-only (409 on send).

### Expiry and cleanup

- **Expired** (`departEnd` passed) and **full** are never stored. They are computed on read by `isActive` and `isFull`, so no cron job is needed.
- MongoDB **TTL indexes** delete pools 1 day after `departEnd`, messages at their `expiresAt` (same moment), and codes 10 minutes after creation.

---

## 5. Data model

Four collections. Models live in `lib/models/`.

### `users` (`User.js`)
| Field | Notes |
|---|---|
| `email` | unique, lowercase, trimmed; a college address |
| `name` | 2–50 characters; full name, shown only to the user |
| `nickname` | optional, up to 20; what others see. Unset means "the email part before the dot" |
| `phone` | 10-digit Indian mobile number, for WhatsApp |
| `gender` | `female` / `male` / `unspecified`; set once at sign-up |
| `passwordHash` | bcrypt, 10 rounds; missing only on old Google-only accounts |
| `createdAt` | |

### `otps` (`Otp.js`)
| Field | Notes |
|---|---|
| `email` | unique: one pending code per email |
| `codeHash` | bcrypt hash; the plain code is never stored |
| `attempts` | deleted after 5 wrong tries |
| `expiresAt` | TTL index, 10 minutes |
| `createdAt` | drives the 60 s wait between codes |

Used for both sign-up and password reset. They can't clash: sign-up needs a new email, reset needs an existing one.

### `pools` (`Pool.js`)
| Field | Notes |
|---|---|
| `from`, `to` | place ids from `lib/places.js`; different; one is `campus` |
| `departStart`, `departEnd` | window of up to 3 h |
| `capacity` | 2–5, creator included |
| `totalFare` | rupees, default 400 |
| `creator` | user id |
| `members` | user ids, join order; `members[0]` is the creator |
| `sharedPhones` | members who chose to share their number |
| `womenOnly` | default false |
| `status` | `open` / `cancelled` |

Indexes: `{status, departEnd}` for the list; `{departEnd}` TTL 86 400 s (deleted 1 day after departure).

### `messages` (`Message.js`)
| Field | Notes |
|---|---|
| `pool`, `author` | ids |
| `text` | 1–500 characters |
| `createdAt` | |
| `expiresAt` | pool's `departEnd` + 1 day; TTL index |

Index `{pool, createdAt}` for loading a chat.

**Places** are a constant in `lib/places.js`, not a collection: VIT-AP Campus, Vijayawada Bus Stand, Vijayawada Railway Station, Gannavaram Airport, PVP Square, Trendset Mall.

---

## 6. Auth, sessions and cookies

| Cookie | Holds | Lifetime | Set by |
|---|---|---|---|
| `session` | JWT (HS256, `JWT_SECRET`) with `{ userId }` | 7 days | login, register, Google callback / complete, reset |
| `google_state` | random value to stop forged OAuth callbacks | 10 min | `/api/auth/google` |
| `google_signup` | JWT `{ purpose: "google_signup", email, name }` | 15 min | Google callback for a new user |

All are `httpOnly`, `sameSite=lax`, and `secure` in production. A session token can't be used as a signup token or the other way round (the `purpose` claim is checked).

---

## 7. Business rules

Pure functions in `lib/rules.js`: no database, no request, all unit tested.

| Function | Rule |
|---|---|
| `normalizeEmail`, `isCollegeEmail` | trim and lowercase; domain must be exactly `vitapstudent.ac.in` or `vitap.ac.in` |
| `googleAccountError(claims)` | Google email must be verified and a college address |
| `farePerPerson(total, members)` | `ceil(total / members)`: ₹400 → 400, 200, 134, 100 |
| `isActive(pool, now)` | open and `departEnd` in the future |
| `isFull(pool)` | members reached capacity |
| `joinBlockReason(...)` | why a join is refused, or `null` |
| `chatBlockReason(...)` | `not_member`, `ended`, or `null` |
| `canSeePool(pool, user)` | women-only pools: women and current members only |
| `visibleMembers(pool, viewer)` | members by display name; phones only to fellow members, only if shared |
| `nicknameFromEmail`, `displayName` | `kiran.23bce7123@…` → "Kiran"; saved nickname wins, full name is the last fallback |
| `istDayRange(date)` | midnight to midnight IST for the day filter |

The zod schemas in `lib/validation.js` carry the input rules (lengths, formats, the campus-end rule, the time window).

---

## 8. API reference

All bodies and responses are JSON. Errors are `{ error }`.

### Auth
| Method and path | Does | Notable answers |
|---|---|---|
| `POST /api/auth/request-otp` | email a 6-digit code; `purpose` is `register` (default) or `reset` | 400 bad email, 409 already registered, 404 no account (reset), 429 wait, 502 email failed |
| `POST /api/auth/register` | create account with code, name, phone, gender, password | 400 wrong/expired code, 409 exists, 201 |
| `POST /api/auth/login` | log in | 401 "Wrong email or password" |
| `POST /api/auth/logout` | clear the session | 200 |
| `GET /api/auth/me` | the logged-in user | 401 |
| `POST /api/auth/reset-password` | set a new password with a code | 400 code, 404 no account |
| `GET /api/auth/google` | start Google sign-in | redirect |
| `GET /api/auth/google/callback` | finish Google sign-in | redirect to `/pools`, `/finish-profile` or `/login?error=…` |
| `GET /api/auth/google/pending` | email and name for `/finish-profile` | 401 expired |
| `POST /api/auth/google/complete` | create the Google account | 401 expired, 409 exists, 201 |
| `POST /api/account` | edit nickname, name, phone (gender is ignored) | 400 |

### Pools (all need login)
| Method and path | Does | Notable answers |
|---|---|---|
| `GET /api/pools?from&to&date` | list active pools | 400 bad date |
| `POST /api/pools` | create | 400, 403 women-only by non-woman, 409 already in a pool, 201 |
| `GET /api/pools/mine` | your active pool, or `null` | |
| `GET /api/pools/:id` | one pool | 404 missing or hidden |
| `POST /api/pools/:id/join` | join (`sharePhone`) | 404, 409 with reason |
| `POST /api/pools/:id/leave` | leave | 403 creator, 409 not a member |
| `POST /api/pools/:id/cancel` | cancel (creator only) | 403 |
| `POST /api/pools/:id/share` | turn number sharing on or off | 403 not a member |
| `GET /api/pools/:id/messages` | latest 100 messages | 403 not a member, 404 hidden |
| `POST /api/pools/:id/messages` | send a message | 403, 409 pool ended, 201 |

---

## 9. Frontend: every page and component

All pages are client components (`"use client"`) except the landing, Terms and Privacy pages, which are static. They share the look described in `DESIGN.md` ("The Auto Fare Meter").

### Pages (`app/`)
| Route | File | Who | What it does |
|---|---|---|---|
| `/` | `page.js` | logged out | Landing page: headline and sign-up buttons, a table showing the fare drop from ₹400 to ₹100, how it works in 3 steps, features, the 6 places, final call to action |
| `/login` | `login/page.js` | logged out | Email and password form, "Forgot password?", Google button, and the 4 demo accounts with one-tap fill. Shows Google error messages from `?error=` |
| `/register` | `register/page.js` | logged out | Step 1: college email → code sent. Step 2: code, full name, WhatsApp number, gender (once only), password. Google button on step 1 |
| `/finish-profile` | `finish-profile/page.js` | logged out, mid-Google | New Google users add name, WhatsApp, gender and password. Shows "Sign in again" if the 15-minute window passed |
| `/forgot-password` | `forgot-password/page.js` | anyone | Step 1: email → code. Step 2: code and new password → logged in. Also how old Google accounts set a password |
| `/pools` | `pools/page.js` | logged in | Your-pool banner, From / To / Day filters, pool cards (1, 2 or 3 per row by screen width), "Create a pool" (fixed at the bottom on phones, in the header on laptops) |
| `/pools/new` | `pools/new/page.js` | logged in | Create form: From / To (campus always one end; To narrows to valid choices), time window, seats, fare with live per-person split, share checkbox, "Women only" for women. Links to your pool if you already have one |
| `/pools/[id]` | `pools/[id]/page.js` | logged in | Route and time, big fare meter with seat pips, members with WhatsApp buttons, join / share / leave / cancel. Members see the chat (right column on laptops). Clear states for not found, cancelled, departed, full |
| `/account` | `account/page.js` | logged in | Email and gender read-only; edit nickname, full name and WhatsApp number; "Change password" link; Log out |
| `/terms` | `terms/page.js` | anyone | Terms of Service |
| `/privacy` | `privacy/page.js` | anyone | Privacy Policy: what's stored, who sees it, retention, cookies, services |

### Shell and components
| File | What it does |
|---|---|
| `app/layout.js` | Root layout: loads the fonts (Barlow Condensed, Roboto Mono), renders `Nav`, the `<main>` container (up to 1152 px wide) and the Terms / Privacy footer |
| `app/globals.css` | Tailwind import, colour and font tokens, the one animation (fare drops in), and the shared classes `.btn`, `.btn-outline`, `.field`, `.select-chevron`, `.card`, `.link` |
| `app/components/Nav.js` | Yellow top bar. Logo goes to `/pools` or `/`; shows Pools and Account when logged in, Log in when not. Re-checks the session on every page change |
| `app/components/PoolCard.js` | One pool in the list (route, time, "Name's pool", seat pips, seats left, fare panel). Also exports `Fare` (the yellow mono figure that animates down when someone joins) and `Seats` (the seat pips) |
| `app/components/Chat.js` | Pool chat: polling, message list (yours in yellow on the right), send box, read-only note after the pool ends |
| `app/components/GoogleButton.js` | "or" divider and the "Continue with Google" link |
| `lib/client.js` | Browser helpers: `api()` (fetch wrapper with one result shape), `formatTime` / `formatWindow` (IST times like "Fri 24 Oct, 5:00 pm – 5:30 pm"), `nextIstDays` (the Day filter options) |

### Layout rules
- Phone first. Forms stay in a narrow column at any width; the pools list, pool page, login and landing page use two or three columns on laptops.
- Money, times and codes are mono; routes and buttons are the condensed display face; prose is the system font.
- Yellow text only on black. Green only for "seats left", red only for errors. No shadows.

---

## 10. Backend: every server file

### `lib/`
| File | What it does |
|---|---|
| `db.js` | `connectDB()`: one cached Mongoose connection shared across requests (serverless-safe) |
| `auth.js` | bcrypt hash and verify, OTP generation, sign and read session tokens, the Google cookies, `getUser`, `unauthorized` |
| `http.js` | `fail(status, message)` and `isValidId(id)`. Imports `next/server`, so plain-node scripts must not import it |
| `validation.js` | Every zod schema and `parseBody` |
| `rules.js` | The pure business rules (section 7) |
| `pools.js` | `hasActivePool`, `withMembers` (which user fields to load), `toPoolJSON` and `toMessageJSON` (the only shapes sent to the browser) |
| `otp.js` | `checkOtp(email, code)`, shared by register and reset: claims an attempt atomically, compares, deletes after 5 misses |
| `mail.js` | `otpEmail(code, purpose)` builds the themed HTML and plain-text email; `sendOtp` sends it with Resend |
| `places.js` | The 6 places with full and short labels |
| `models/*.js` | Mongoose schemas and indexes (section 5) |

### `app/api/`
One folder per endpoint, each with a `route.js` exporting `GET` / `POST` (section 8). Routes stay thin: identify the user, validate, call rules, do one database operation, return JSON from `lib/pools.js`.

### `proxy.js`
Next.js 16's middleware. Redirects between logged-in and logged-out pages using only the JWT signature, so the right page shows on first paint. A token for a deleted user still passes the proxy; the page's API call then answers 401 and sends it to `/login`.

---

## 11. Tooling, scripts and config

| File | What it does |
|---|---|
| `scripts/seed.js` | `npm run seed`. Upserts 4 demo logins (demo1 and demo3 male, demo2 and demo4 female, shared `DEMO_PASSWORD`) and 7 seed-only "(demo)" members with unknown passwords, then recreates 4 sample pools (one women-only). Only touches its own accounts. Runs with plain node, so it doesn't import `lib/auth.js` or `lib/http.js` |
| `tests/*.test.js` | Vitest unit tests: `rules`, `validation`, `auth` (hashing and tokens), `client` (time formatting), `mail` (email content). 93 tests |
| `TESTING.md` | Automated test summary and the manual test plan with IDs (R, L, C, J, M, W, G, P, N) |
| `next.config.mjs` | `cacheComponents: true` |
| `vitest.config.js`, `eslint.config.mjs`, `jsconfig.json` | Test runner, lint rules, the `@/` import alias |
| `.env.example` | Every variable name: `MONGODB_URI`, `JWT_SECRET`, `RESEND`, `EMAIL_FROM`, `DEMO_PASSWORD`, `NEXT_PUBLIC_DEMO_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `README.md` | What it is, setup steps, demo accounts, known limitations |
| `DESIGN.md`, `PRODUCT.md` | The visual system and the product context used for UI work |

---

## 12. Decision log

### Stack and infrastructure
| # | Decision | Alternatives | Why |
|---|---|---|---|
| 1 | Next.js full-stack on Vercel | React + Express on Render | Render's free tier sleeps and the URL must stay up. One deploy instead of two. |
| 2 | MongoDB Atlas | Postgres (Neon) | Team choice; pool documents with member lists fit well. |
| 3 | Resend with an own verified domain | Gmail SMTP, Brevo | Better deliverability, one-call API, free tier is enough. |
| 4 | Custom auth (bcrypt + JWT cookie) | NextAuth / Auth.js | About 60 lines, fully explainable; Auth.js handles email + password awkwardly. |
| 5 | Few dependencies, plain code | UI kits, auth and form libraries | Every line must be explainable in the interview. |

### Accounts
| # | Decision | Alternatives | Why |
|---|---|---|---|
| 6 | OTP once at sign-up, then password | OTP on every login | Proves the email once without a code on every visit; reviewers log in with plain credentials. |
| 7 | Seeded demo accounts shown on the login page | Only in the submission email | Reviewers can't get a college inbox; one tap is as close to "no login wall" as possible. |
| 8 | Same 401 for unknown email and wrong password, with a dummy-hash compare | Separate messages | Doesn't reveal who has an account through the login form. |
| 9 | Login refuses accounts with no password hash | Let them through to the dummy compare | The dummy hash's password is known; without this check anyone could log into a Google-only account. |
| 10 | Google OAuth by hand with `fetch` + jose | Auth.js, Google's client library | Two routes; reuses the existing session; no new dependency. |
| 11 | Google sign-up asks for a password; reset reuses the OTP flow | Reset-token links | Google users can also log in by email. Reuses the Otp model, 60 s wait and 5-try limit (`lib/otp.js`); old Google-only accounts set a password the same way. |
| 12 | Reset answers 404 for an unknown email | Always say "sent" | Clearer for students; sign-up already reveals existence with its 409. |
| 13 | Gender chosen once at sign-up, never editable | Editable on a profile page | An editable gender would make women-only pools easy to get into. `accountSchema` has no gender, so zod drops it. Old accounts stay "Not set". |
| 14 | `/profile` became `/account`; Log out moved there | Name and Log out in the nav | Cleaner nav; one place for your details. |
| 15 | Nickname shown to others, default from the email (`name.regno@…`), computed on read | Store one for everyone with a migration | Free default, no migration; full names stay private; emails are never sent to the browser. |

### Pools
| # | Decision | Alternatives | Why |
|---|---|---|---|
| 16 | Expired and full computed on read | Cron job | No scheduler; expired pools just stop showing. |
| 17 | Atomic conditional join | Read, check, then write | Two people can't both get the last seat. |
| 18 | Creator enters the total fare (default ₹400) | Fixed fare table | Real fares change; the creator knows today's quote. |
| 19 | Fare rounds up (`ceil`) | Exact or rounded | The driver never ends up short; ₹134 instead of ₹133.33. |
| 20 | One active pool per student, created or joined | No limit | Stops "just in case" pools filling the list. |
| 21 | Phone sharing opt-in per pool, default on | Always or never share | WhatsApp is the fast path, but each person decides per pool. |
| 22 | Fixed list of 6 places | Map or free text | Matching only works when people pick the same place. |
| 23 | Every pool starts or ends at VIT-AP Campus; the form only offers valid pairs | Any two places | Autos run between campus and the city; city-to-city pools are noise. |
| 24 | Window of up to 3 h, up to 7 days ahead | Exact time; no limits | A window matches how students plan; limits keep the list relevant. |

### Chat, women-only, data lifetime
| # | Decision | Alternatives | Why |
|---|---|---|---|
| 25 | Chat polls every 2 s | Pusher/Ably, Server-Sent Events | Vercel functions can't hold sockets; polling needs no extra service. Skips while the tab is hidden and stops when the pool ends. |
| 26 | Chat for current members only, read-only after the pool ends | Open to all; always writable | Privacy, and an ended pool has nothing left to plan. |
| 27 | TTL deletes pools and messages 1 day after departure | Keep forever; cleanup cron | Data is only useful around the ride; keeps the free cluster small and old chats private. |
| 28 | Hidden women-only pools answer 404 | 403 | A 403 would confirm the pool exists. |
| 29 | Current members keep seeing their women-only pool | Strict gender check | Nobody is locked out of a pool they're in. |

### Frontend
| # | Decision | Alternatives | Why |
|---|---|---|---|
| 30 | `proxy.js` redirects by cookie (signature only, no DB) | Client-side check after load | Right page on first paint, no flash. |
| 31 | "Auto Fare Meter" look: yellow and black, mono money, no shadows | Generic UI kit | Recognisable, high-contrast outdoors, matches the product. |
| 32 | Phone first, laptop layout per page | One narrow column everywhere | Most use is on phones; laptops now get grids and two columns. |
| 33 | One `api()` result shape, even on network failure | try/catch in every page | Every page handles errors one way. |
| 34 | Landing page shows the fare drop as the main visual | Stock imagery | The fare split is the reason to use the app. |
| 35 | Themed HTML email with inline styles and a plain-text fallback | Plain text only | Matches the app; email clients ignore `<style>` and web fonts. |
| 36 | Terms and Privacy contact via GitHub Issues | Personal email | Keeps a personal address off a public site. |

### Process
| # | Decision | Why |
|---|---|---|
| 37 | Built in independent phases; each only adds | The app is complete at any phase; later phases can be cut. |
| 38 | Small commits per working step; feature branches merged by PR | Graded repo history; easy review. |
| 39 | Unit tests on pure rules and schemas, manual plan for flows | Fastest way to cover the logic that matters before the deadline. |

---

## 13. Security summary

- Passwords and codes are stored only as bcrypt hashes.
- Sessions are signed, httpOnly cookies; the secret is in `JWT_SECRET`.
- Every API input is validated by zod at the boundary; unknown fields are dropped.
- Codes: 10-minute life, 5 tries, 60 s between requests, attempts claimed atomically.
- Google: state cookie against forged callbacks; `id_token` verified against Google's keys; email must be verified and a college address; the new account's email comes only from a signed cookie.
- Responses carry only what the viewer may see: no emails in pool data, phones only to fellow members who were shared with, hidden women-only pools look like missing ones.
- Secrets live in `.env` (gitignored); `.env.example` lists names only.

---

## 14. Known limitations

- Gender is self-declared; a college email proves you're a student, not your gender.
- No login brute-force limit, and code requests are limited per email, not per IP.
- No chat message rate limit; messages arrive up to 2 s late.
- A double-tap on Join on two different pools at the same instant could join both (fixing it needs a transaction).
- The share, leave and cancel routes answer 403/409 rather than 404 for a hidden women-only pool, so someone with its id can tell it exists.
- Resend's free tier allows 100 emails a day.
- Fares are estimates; the driver sets the real price.
- No automated browser tests; flows are covered by the manual plan in `TESTING.md`.
