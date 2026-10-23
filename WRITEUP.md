<!-- Draft: edit into your own voice before submitting. -->
# PoolUp write-up

**Problem and user.** VIT-AP is about 18 km from Vijayawada, and an auto to the station or airport costs around ₹400 if you go alone. Students look for company in scattered WhatsApp groups. PoolUp is for VIT-AP students: one place that shows every pool on a route and the per-person fare, which drops from ₹400 toward ₹100 as seats fill.

**Key decisions.**
1. College email plus an OTP to register, password after that. Only verified students are in, and nobody has to enter a code on every login. Demo accounts are seeded because reviewers cannot receive a college email.
2. WhatsApp number sharing is opt-in per pool. Students already coordinate on WhatsApp, so a one-tap link is the fast path, but nobody's number goes out without their say. Members see only the numbers that were shared.
3. One active pool per student, a window of at most 3 hours, and six fixed places. This keeps the list small and the rules checkable.

**Cut, and next.** I split the idea into six phases and shipped only the first: accounts and pools. Chat, women-only pools, Google sign-in, match alerts and the auto queue are not built. Next I would build live chat, so people who do not share a number can still coordinate.

**What broke or surprised me.**
- Review found races. Two people could take the last seat, so joining is now one conditional database update. Parallel OTP guesses could beat the 5-try limit, so each attempt is claimed atomically. Double-tapping "send code" could create two codes, so that is a filtered upsert.
- Next 16 with `cacheComponents` refused to build `/pools/[id]` until I wrapped the nav in Suspense.
- Time zones: Vercel runs in UTC and students think in IST. I fixed all display and day filtering to IST and wrote tests for it, including when UTC is still on the previous day.
- Seeded demo pools depart before anyone reviews the site. I left them to expire and wrote a two-minute path in the README: log in as demo1, create a pool, join it as demo2.

Known gaps: two simultaneous joins to two different pools can slip through, and login has no brute-force limit.
