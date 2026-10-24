# Testing

## Automated tests

```bash
npm test      # vitest run
```

Last run: 4 files, 90 tests, all passing.

| File | What it checks |
|---|---|
| `tests/rules.test.js` | The six places; college email check (both domains, wrong domains, capitals); per-person fare rounds up; `isActive` needs open status and a future end; `joinBlockReason` for each reason (cancelled, expired, full, already a member, `has_active_pool`) and its order; populated members; `visibleMembers` hides phones from non-members and shows only shared phones to members; `istDayRange` is IST midnight to midnight; `chatBlockReason` lets members of an active pool post, blocks non-members, and makes an ended pool read-only; `canSeePool` shows women-only pools only to women (not to men, unset or "prefer not to say") but also to its current members; `googleAccountError` refuses an unverified Google email and a non-college one; the nickname is the email part before the dot, capitalized and at most 20 characters, and the shown name prefers a saved nickname, then the email, then the full name; pool members are listed by nickname. |
| `tests/validation.test.js` | Zod schemas: register lowercases the email, bad phone and bad OTP rejected, non-college email gives the exact message, login normalizes email; create pool applies defaults and rejects from equal to to, a 3 h 1 min window (3 h allowed), an end in the past, a start 8 days out, end before start; join defaults sharing to on; share needs a boolean; `parseBody` never throws on junk; a chat message is trimmed, blank is rejected, and 500 characters is the most; register and the Google finish-profile form need a gender from the three options; the finish-profile form trims the name and rejects a bad phone; the account form edits name and phone and drops any gender sent to it; the Google form needs a password of 8 or more (missing gives the same message); a code request defaults to register and accepts only register or reset; a reset lowercases the email and rejects a short password or a bad code. |
| `tests/auth.test.js` | OTP is always 6 digits; password/OTP hash accepts the right value and rejects a wrong one; session token round-trips the user id, returns null for garbage or a token signed with another secret, and fails loudly when `JWT_SECRET` is missing; the Google signup token round-trips email and name, is not accepted as a session, a session token is not accepted as a signup token, and a tampered token is rejected. |
| `tests/client.test.js` | Time display is IST, not UTC; midnight and morning; a window shows the day once or twice depending on IST midnight; the next-days list uses IST dates even when UTC is still on the previous day. |

The database routes and the UI are not unit tested. They are covered by the manual plan below.

## Manual test plan

Run against https://poolup.kirankatakam.me (or `npm run dev`). Demo password is shown on the login page. Use two browsers (or one plus a private window) for the join tests.

| ID | Flow | Steps | Expected |
|---|---|---|---|
| R1 | Register, happy path | Open Register, enter a real college email, name, phone, password. Enter the code from the email. | Account is created, you land on the pools page, logged in. |
| R2 | Register, wrong code | Request a code, enter 000000. | Error message. You can try again. |
| R3 | Register, 5 wrong tries | Enter a wrong code 5 times. Then enter the right code. | After the 5th miss the code is deleted. The right code is rejected and you must request a new one. |
| R4 | Register, resend within 60 s | Request a code, request again immediately. | Rejected (429) with the seconds left. After 60 s it works. |
| R5 | Register, non-college email | Use a gmail.com address. | "Use your @vitapstudent.ac.in or @vitap.ac.in email". No email is sent. |
| R6 | Register, email already registered | Use `demo1@vitapstudent.ac.in`. | Message pointing you to log in. |
| R7 | Register, email send fails | Run locally with an invalid `RESEND` key, then request a code. | "Couldn't send email, try again." A retry is not blocked by the 60 s wait. |
| L1 | Login, happy path | Log in as demo1 with the demo password. | Logged in, pools page. |
| L2 | Login, wrong password | Right email, wrong password. | Generic error, not logged in. |
| P1 | Forgot password, happy path | On `/login` press "Forgot password?", enter your email, enter the code from the email and a new password. | Logged in, pools page. Logging out and in with the new password works; the old one is rejected. |
| P2 | Forgot password, unknown email | Enter a college email with no account. | "No account with this email. Create one instead." No email is sent. |
| P3 | Forgot password, wrong or reused code | Enter 000000, then use a code that already reset the password. | "Wrong code", then "Code expired, request a new one". 5 wrong tries delete the code, as in R3. |
| P4 | Google-only account sets a password | For a Google account with no password, run P1. | Email login now works with that password, and Google still works. |
| L2b | Login, Google-only account | For a user with no `passwordHash`, log in with any password, including `dummy-password`. | 401 "Wrong email or password", not logged in. |
| C1 | Create, happy path | Pick from and to, a window, seats, fare, submit. | Pool page opens with you as the only member and the full fare each. |
| C2 | Create, same place | Set from and to to the same place. | Rejected, nothing created. |
| C3 | Create, past time | Set a window that has already ended. | Rejected. |
| C4 | Create, window over 3 h | Start 10:00, end 13:01. | Rejected. 3 h exactly is accepted. |
| C5 | Create, over 7 days ahead | Start 8 days from now. | "You can only plan up to 7 days ahead". |
| C6 | Create while in an active pool | Create a second pool as a user already in one. | Rejected (409) with a link to your current pool. |
| J1 | Join, happy path | As demo2, open demo1's pool and join. | You appear in the member list. Seats left goes down and the ₹ each figure drops. |
| J2 | Join, full pool | Fill a pool (capacity 2), then try with a third user. | Rejected with "full". |
| J3 | Join, already in another pool | Join a pool as a user already in an active pool. | Rejected (409). The page shows "You're already in another pool. Leave it first." as text, with no link. |
| J4 | Join, race for last seat | Pool with 1 seat left. Two users open it, both press Join at the same moment. | Exactly one joins; the other sees "full". Seats never go below zero. |
| J5 | Join, double tap | Tap Join twice quickly. | One membership only. |
| S1 | Sharing on | Join with sharing on. As another member, open the pool. | Your name and a WhatsApp button are visible to members. |
| S2 | Sharing off | Join with sharing off. As another member, open the pool. | Your name is visible, no WhatsApp button, number not in the page data. |
| S3 | Non-member view | Log in as a user not in the pool and open it. | No phone numbers or WhatsApp buttons. |
| S4 | Change sharing later | Toggle sharing on the pool page. | The button appears or disappears for others. |
| V1 | Leave | Join, then Leave. | You are removed, seats and fare update, you can join another pool. |
| V2 | Cancel (creator) | Creator cancels. | Pool shows CANCELLED. No join or leave actions. |
| V3 | Cancel (non-creator) | Member tries to cancel. | No cancel button; the API refuses. |
| E1 | Expired pool | Open a seeded pool after its time has passed. | Shows DEPARTED, or "not found" once a day has passed (pools are deleted 1 day after departure). No actions, not in the active list. |
| E2 | Cancelled pool view | Open a cancelled pool link. | Shows CANCELLED, no actions. |
| E3 | Bad pool URL | Open `/pools/not-an-id` and `/pools/<valid-but-missing-id>`. | A clear "pool not found" state, not a crash. |
| E4 | Logged out | Open `/pools` logged out. | Redirected to login. |
| E6 | Stale session, deleted user | Log in, delete that user from the database, then reload `/pools`. | The API answers 401 and clears the `session` cookie, the page lands on login, and there is no redirect loop. |
| E5 | Time zone | Create a pool for 5:00 PM. | Shown as 5:00 PM IST on every screen, on local and on the deployed (UTC) site. |
| M1 | Chat, live | demo1 and demo2 (private window) in one pool. Send a message from each. | The message shows on the other screen within about 2 s. Your own messages are yellow and labelled "You". |
| M2 | Chat, member leaves | demo2 leaves the pool with the chat open. | demo2's chat panel disappears, and the Network tab shows no more requests to `/messages`. |
| M3 | Chat, pool cancelled | demo1 cancels the pool with the chat open. | The input is replaced by "This pool has ended, so the chat is read-only." Old messages stay visible and polling stops in the canceller's window; other members' panels switch to read-only after they reload. |
| M4 | Chat, non-member | As demo3 (not in the pool), call `GET /api/pools/<id>/messages`. | 403 "Only pool members can see this chat". No chat panel on the pool page. |
| M5 | Chat, blank message | Press Send with an empty or spaces-only box. | 400 "Type a message", shown under the chat. Nothing is posted. |
| W1 | Women-only, create | As demo2 (female), tick "Women only" on New pool and submit. | The pool page shows a "Women only" badge. |
| W2 | Women-only, hidden from list | As demo1 (male), open `/pools`. | A women-only pool (create one as demo2 per W1) is not in demo1's list, and demo2 sees it. |
| W3 | Women-only, direct link | As demo1, open a women-only pool's URL, and call `POST /api/pools/<id>/join`. | Pool not found (404), not 403. |
| W4 | Women-only, non-female creates | As demo1, `POST /api/pools` with `womenOnly: true`. | 403. Nothing created. |
| W5 | Women-only, join | As demo2, open a women-only pool (create one as demo2 per W1) from `/pools`. | It is listed, opens, and you appear in the member list. |
| W6 | Gender at sign-up | On `/register` step 2 (or `/finish-profile`), leave Gender on "Choose…" and submit. | "Pick your gender". Picking one creates the account with that gender. |
| N1 | Nickname shown | Change your nickname in Account, then open your pool and send a chat message. | The member list, the pool card ("Name's pool") and the chat show the new nickname, never the full name. A 1-character nickname shows "Nickname needs at least 2 characters". |
| W7 | Account page | Log in, press Account in the nav. Change your nickname, name and WhatsApp number, save, reload. Then press Log out. | Email and gender are shown but not editable. The new name and number are kept after reload. Log out lands on the home page. A bad number shows "Enter a 10-digit Indian mobile number". |
| G1 | Google, new account | Logged out, press "Continue with Google" on `/login` and pick a college Google account that has no PoolUp account. | You land on `/finish-profile` with your email shown and your name filled in. Add a WhatsApp number, pick a gender, set a password and press Create account: you land on `/pools`, logged in. |
| G2 | Google, existing account | Press "Continue with Google" with a college Google account already registered (by OTP or by G1). | Straight to `/pools`, logged in. No finish-profile step. |
| G3 | Google, non-college account | Press "Continue with Google" and pick a gmail.com account. | Back on `/login` with "Use your @vitapstudent.ac.in or @vitap.ac.in Google account." No account is created. |
| G4 | Google, cancelled | Press "Continue with Google", then press Cancel on Google's screen (or go back). | Back on `/login` with "Google sign-in didn't finish. Try again." |
| G5 | Finish profile, expired | Open `/finish-profile` without signing in with Google first, or 15 min after G1's redirect. | "Sign in again" with a link back to log in. Submitting an old form answers 401 and shows the same state. |
| G6 | Finish profile, bad phone | On `/finish-profile`, enter `12345` and submit. | "Enter a 10-digit Indian mobile number". `+91 98765 43210` is accepted. |

## Not tested and why

- **No end-to-end browser tests.** Setting up Playwright with a seeded database and a fake mailbox would have cost more time than the deadline allowed. The manual plan above covers the same flows.
- **Google sign-in (G1 to G4)** needs a real college Google account, so it is checked by hand on the live site and shown in the demo video. In development the pages were checked in headless Chrome: the button and both error messages on `/login`, the button on `/register`, `/finish-profile` with no cookie, and with a self-signed `google_signup` cookie for a `zz-test-` address (name filled in, account created, then deleted).
- **Real OTP delivery** to a college inbox is tested manually on the live site after deploy (planned). Resend sending was verified during development through Resend's test address `delivered@resend.dev`.
- **Race conditions** have no automated concurrency test. The OTP guess race (R3) was checked during development: 6 parallel wrong codes, none succeeded, and the code was deleted. The 60-second resend race (R4) was checked with an existing recent code and returned 429. The last-seat join race (J4, J5) is enforced by a single atomic database update but was not load-tested.
- **Database outage** (500 with a general message) is not simulated.
- **Login brute force** has no limit and is not tested (see known limitations in `README.md`).
