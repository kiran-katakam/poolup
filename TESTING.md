# Testing

## Automated tests

```bash
npm test      # vitest run
```

Last run: 4 files, 43 tests, all passing.

| File | What it checks |
|---|---|
| `tests/rules.test.js` | The six places; college email check (both domains, wrong domains, capitals); per-person fare rounds up; `isActive` needs open status and a future end; `joinBlockReason` for each reason (cancelled, expired, full, already a member) and its order; populated members; `visibleMembers` hides phones from non-members and shows only shared phones to members; `istDayRange` is IST midnight to midnight. |
| `tests/validation.test.js` | Zod schemas: register lowercases the email, bad phone and bad OTP rejected, non-college email gives the exact message, login normalizes email; create pool applies defaults and rejects from equal to to, a 3 h 1 min window (3 h allowed), an end in the past, a start 8 days out, end before start; join defaults sharing to on; share needs a boolean; `parseBody` never throws on junk. |
| `tests/auth.test.js` | OTP is always 6 digits; password/OTP hash accepts the right value and rejects a wrong one; session token round-trips the user id, returns null for garbage or a token signed with another secret, and fails loudly when `JWT_SECRET` is missing. |
| `tests/client.test.js` | Time display is IST, not UTC; midnight and morning; a window shows the day once or twice depending on IST midnight; the next-days list uses IST dates even when UTC is still on the previous day. |

The database routes and the UI are not unit tested. They are covered by the manual plan below.

## Manual test plan

Run against LIVE_URL_TBD (or `npm run dev`). Demo password is shown on the login page. Use two browsers (or one plus a private window) for the join tests.

| ID | Flow | Steps | Expected |
|---|---|---|---|
| R1 | Register, happy path | Open Register, enter a real college email, name, phone, password. Enter the code from the email. | Account is created, you land on the pools page, logged in. |
| R2 | Register, wrong code | Request a code, enter 000000. | Error message. You can try again. |
| R3 | Register, 5 wrong tries | Enter a wrong code 5 times. Then enter the right code. | After the 5th miss the code is deleted. The right code is rejected and you must request a new one. |
| R4 | Register, resend within 60 s | Request a code, request again immediately. | Rejected (429) with the seconds left. After 60 s it works. |
| R5 | Register, non-college email | Use a gmail.com address. | "Use your @vitapstudent.ac.in or @vitap.ac.in email". No email is sent. |
| R6 | Register, email already registered | Use `demo1@vitapstudent.ac.in`. | Message pointing you to log in. |
| R7 | Register, email send fails | (Only if easy to force, e.g. a bad `RESEND` key locally.) | "Couldn't send email, try again." A retry is not blocked by the 60 s wait. |
| L1 | Login, happy path | Log in as demo1 with the demo password. | Logged in, pools page. |
| L2 | Login, wrong password | Right email, wrong password. | Generic error, not logged in. |
| C1 | Create, happy path | Pick from and to, a window, seats, fare, submit. | Pool page opens with you as the only member and the full fare each. |
| C2 | Create, same place | Set from and to to the same place. | Rejected, nothing created. |
| C3 | Create, past time | Set a window that has already ended. | Rejected. |
| C4 | Create, window over 3 h | Start 10:00, end 13:01. | Rejected. 3 h exactly is accepted. |
| C5 | Create, over 7 days ahead | Start 8 days from now. | "You can only plan up to 7 days ahead". |
| C6 | Create while in an active pool | Create a second pool as a user already in one. | Rejected (409) with a link to your current pool. |
| J1 | Join, happy path | As demo2, open demo1's pool and join. | You appear in the member list. Seats left goes down and the ₹ each figure drops. |
| J2 | Join, full pool | Fill a pool (capacity 2), then try with a third user. | Rejected with "full". |
| J3 | Join, already in another pool | Join a pool as a user already in an active pool. | Rejected (409) with a link to your current pool. |
| J4 | Join, race for last seat | Pool with 1 seat left. Two users open it, both press Join at the same moment. | Exactly one joins; the other sees "full". Seats never go below zero. |
| J5 | Join, double tap | Tap Join twice quickly. | One membership only. |
| S1 | Sharing on | Join with sharing on. As another member, open the pool. | Your name and a WhatsApp button are visible to members. |
| S2 | Sharing off | Join with sharing off. As another member, open the pool. | Your name is visible, no WhatsApp button, number not in the page data. |
| S3 | Non-member view | Log in as a user not in the pool and open it. | No phone numbers or WhatsApp buttons. |
| S4 | Change sharing later | Toggle sharing on the pool page. | The button appears or disappears for others. |
| V1 | Leave | Join, then Leave. | You are removed, seats and fare update, you can join another pool. |
| V2 | Cancel (creator) | Creator cancels. | Pool shows CANCELLED. No join or leave actions. |
| V3 | Cancel (non-creator) | Member tries to cancel. | No cancel button; the API refuses. |
| E1 | Expired pool | Open a seeded pool after its time has passed. | Shows DEPARTED, no actions, not in the active list. |
| E2 | Cancelled pool view | Open a cancelled pool link. | Shows CANCELLED, no actions. |
| E3 | Bad pool URL | Open `/pools/not-an-id` and `/pools/<valid-but-missing-id>`. | A clear "pool not found" state, not a crash. |
| E4 | Logged out | Open `/pools` logged out. | Redirected to login. |
| E5 | Time zone | Create a pool for 5:00 PM. | Shown as 5:00 PM IST on every screen, on local and on the deployed (UTC) site. |

## Not tested and why

- **No end-to-end browser tests.** Setting up Playwright with a seeded database and a fake mailbox would have cost more time than the deadline allowed. The manual plan above covers the same flows.
- **Real OTP delivery** was tested manually once on the live site, with a real college inbox. During development, mail was only sent to Resend's test address.
- **Race conditions (J4, J5, R3, R4)** are handled with atomic database updates, and checked by hand rather than by an automated concurrency test.
- **Database outage** (500 with a general message) is not simulated.
- **Login brute force** has no limit and is not tested (see known limitations in `README.md`).
