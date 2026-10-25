# PoolUp write-up

**Problem and user.** VIT-AP is about 18 km from Vijayawada. The two daily buses are always full, and an auto costs around ₹400 if you go alone. Students look for company in scattered WhatsApp groups, so most never learn that someone else was leaving ten minutes later. PoolUp is for VIT-AP students and staff: one place that shows every pool on a route, with a per-person fare that drops from ₹400 toward ₹100 as seats fill.

**Key product decisions.**
1. **Verified college email, then a password.** Sign-up needs a code sent to an @vitapstudent.ac.in or @vitap.ac.in inbox, so everyone in a pool is a real member of campus. After that it is a normal login. I seeded demo accounts because reviewers cannot receive a college email.
2. **Opt-in sharing and women-only pools.** WhatsApp numbers are shared per pool, only if the owner chooses, and only members see them. Women-only pools are invisible to everyone else (404, not 403). Safety is the main reason students would hesitate to ride with strangers.
3. **Tight rules.** One active pool per student, a departure window of at most 3 hours, six fixed places, and one end always the campus. This keeps the list short and every rule testable.

**Cut, and next.** I cut match alerts (email me when a pool matches my saved route) and the auto-queue for drivers at the campus gate. Match alerts come next, because they turn PoolUp into something that finds you.

**What broke or surprised me.**
- **Chat and WebSockets.** I wanted live chat over WebSockets, which I had never used. Vercel's serverless functions cannot hold a persistent connection, so a WebSocket server needed separate hosting I did not have time to learn and run. I shipped 2-second polling instead, so messages can lag by up to 2 seconds.
- **Races.** Two people could take the last seat and parallel code guesses could beat the 5-try limit. Both are now single atomic database operations.
- **Time zones.** Vercel runs in UTC but students think in IST, so all display and day filtering is IST, with tests.

**Known gaps.**
- **Trust and safety:** gender is self-declared and never verified, and there is no way to report a user. Women-only pools rely on honesty.
- **Cancelling:** the creator can cancel a pool without its members' consent.
- **No notifications:** members learn about a cancellation or a new message only when they open the app.
- **Abuse:** no login brute-force limit, and two simultaneous joins to different pools can slip through.