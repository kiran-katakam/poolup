# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, JavaScript) with Tailwind CSS, MongoDB Atlas through Mongoose, Resend for email, deployed on Vercel. Chosen and approved in `docs/architecture.md`.

## Users

**Primary:** VIT-AP students (`@vitapstudent.ac.in`) who need to travel between the campus, about 18 km outside Vijayawada, and city points: bus stand, railway station, airport, PVP Square, Trendset Mall. They're usually leaving for a weekend outing or a holiday, or coming back on Sunday night or after a break. Their job: find others going the same way at the same time so they can share an auto and not pay about ₹400 alone.

**Also allowed:** staff with `@vitap.ac.in` email.

**Later (Phase 6, not built):** auto drivers and an admin managing the serial-order auto queue at the campus gate.

## Product Purpose

Replace scattered WhatsApp-group asks ("anyone going to the station at 4?") with one place where every pool on a route is visible. The campus has about 14,000 students and no central group. Success: a student finds or fills a pool in under a minute, and the per-person fare drops from about ₹400 toward about ₹100.

## Positioning

Built for the one problem of a remote campus: everyone in it is a verified VIT-AP student, the places are the 6 that students actually go to, pools work in both directions, and the app shows the live per-person fare split. A general ride-share app can't truthfully claim a verified, campus-only crowd.

## Operating Context

- **Phone first.** Usually opened from a WhatsApp link, often on the way to the gate. Desktop must work but isn't the main case.
- Coordination happens on WhatsApp after joining, through `wa.me` links for members who chose to share their number. In-app live chat comes in Phase 2.
- Peak use: Friday evenings, weekends, the start and end of holidays.
- The app is also a graded VComply take-home. Reviewers log in with seeded demo accounts shown on the login page, and the whole flow must be clear to someone who has never seen the campus.

## Capabilities and Constraints

- **Phase 1 (submission):** register with a college email plus a one-time OTP, then log in with a password. Create, browse, join, leave and cancel pools. One active pool per student. Pools have from, to, a time window of up to 3 h, capacity 2–5 and an estimated total fare (default ₹400). Sharing your WhatsApp number with a pool is opt-in (default on, can be turned off), and members see only shared numbers.
- **Places (fixed):** VIT-AP Campus, Vijayawada Bus Stand, Vijayawada Railway Station, Gannavaram Airport, PVP Square, Trendset Mall. Any place can be the start or the end.
- **Later phases**, each independent: 2 live chat, 3 women-only pools, 4 Google sign-in, 5 match alerts, 6 auto queue.
- **Terminology:** "pool" (not ride or trip), "seats left", "₹X each".
- **Deadline:** 26 Oct 2026, 11 AM IST. The live URL must stay up until about 5 Nov 2026.

## Brand Commitments

- **Name:** PoolUp.
- **Voice:** batchmate casual, like a friend in the hostel group. Short and plain English, e.g. "Leaving for PNBS at 5? 2 seats left, ₹134 each." Slang has to stay understandable to non-local reviewers. Errors say what happened and what to do, without blame.

## Evidence on Hand

- **WhatsApp screenshots** of real "anyone going to…" messages from campus groups, held by the author. Names must be blurred before use. Not in the repo yet.
- **Fare figure:** about ₹400 for a solo auto between campus and Vijayawada, from the author's own experience.
- **Absent:** user counts, testimonials, surveys, usage data. Future work must not invent them.

## Product Principles

1. **Fill the auto.** Every screen moves a student toward a shared ride. The per-person fare is the reason to act, so show it everywhere.
2. **Seconds, not steps.** Students open it on the way out. Creating or joining a pool should take a few taps.
3. **Trust comes from the email; numbers come from consent.** Only verified college accounts. A phone number is shown only to the same pool's members, and only if its owner chose to share it.
4. **Fastest path first.** WhatsApp is where students already talk, so sharing a number is one tap. In-app chat (Phase 2) serves people who'd rather not share.
5. **Every phase stands alone.** A later feature never changes how an earlier one works.

## Accessibility & Inclusion

- Phone-sized touch targets and legible outdoor use (strong contrast, readable at arm's length in sunlight).
- Women-only pools (Phase 3) are a planned safety feature. Gender is self-declared.
