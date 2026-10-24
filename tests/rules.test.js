import { describe, it, expect } from "vitest";
import {
  isCollegeEmail,
  farePerPerson,
  joinBlockReason,
  visibleMembers,
  istDayRange,
  isActive,
  chatBlockReason,
  canSeePool,
  googleAccountError,
} from "../lib/rules.js";
import { PLACES, PLACE_IDS, placeLabel } from "../lib/places.js";

const now = new Date("2026-10-24T10:00:00Z");
const openPool = (over = {}) => ({
  status: "open",
  departStart: new Date("2026-10-24T11:00:00Z"),
  departEnd: new Date("2026-10-24T12:00:00Z"),
  capacity: 3,
  members: ["u1", "u2"],
  sharedPhones: [],
  ...over,
});

describe("places", () => {
  it("has six places with labels", () => {
    expect(PLACE_IDS).toEqual(["campus", "bus-stand", "railway", "airport", "pvp", "trendset"]);
    expect(PLACES).toHaveLength(6);
    expect(placeLabel("airport")).toBe("Gannavaram Airport");
  });
});

describe("isCollegeEmail", () => {
  it.each(["a@vitapstudent.ac.in", "A@VITAP.AC.IN", " b@vitap.ac.in "])("accepts %j", (e) => {
    expect(isCollegeEmail(e)).toBe(true);
  });
  it.each(["a@gmail.com", "a@vitap.ac.in.evil.com", "a@notvitap.ac.in", "a@sub.vitap.ac.in", "", "novalue"])(
    "rejects %j",
    (e) => {
      expect(isCollegeEmail(e)).toBe(false);
    }
  );
});

describe("farePerPerson", () => {
  it("rounds up", () => {
    expect(farePerPerson(400, 1)).toBe(400);
    expect(farePerPerson(400, 3)).toBe(134);
    expect(farePerPerson(400, 4)).toBe(100);
  });
});

describe("isActive", () => {
  it("needs open status and a future end", () => {
    expect(isActive(openPool(), now)).toBe(true);
    expect(isActive(openPool({ status: "cancelled" }), now)).toBe(false);
    expect(isActive(openPool({ departEnd: new Date("2026-10-24T09:00:00Z") }), now)).toBe(false);
  });
});

describe("joinBlockReason", () => {
  it("returns null when joinable", () => {
    expect(joinBlockReason(openPool(), "u9", false, now)).toBeNull();
  });
  it("returns each reason", () => {
    expect(joinBlockReason(openPool({ status: "cancelled" }), "u9", false, now)).toBe("cancelled");
    expect(joinBlockReason(openPool({ departEnd: new Date("2026-10-24T09:00:00Z") }), "u9", false, now)).toBe("expired");
    expect(joinBlockReason(openPool(), "u1", false, now)).toBe("already_member");
    expect(joinBlockReason(openPool({ capacity: 2 }), "u9", false, now)).toBe("full");
    expect(joinBlockReason(openPool(), "u9", true, now)).toBe("has_active_pool");
  });
  it("checks cancelled before full", () => {
    expect(joinBlockReason(openPool({ status: "cancelled", capacity: 2 }), "u9", false, now)).toBe("cancelled");
  });
  it("handles populated members", () => {
    const pool = openPool({ members: [{ _id: "u1", name: "A" }] });
    expect(joinBlockReason(pool, "u1", false, now)).toBe("already_member");
  });
});

describe("visibleMembers", () => {
  const pool = openPool({
    members: [
      { _id: "u1", name: "A", phone: "111" },
      { _id: "u2", name: "B", phone: "222" },
    ],
    sharedPhones: ["u2"],
  });
  it("hides phones from non-members", () => {
    const out = visibleMembers(pool, "u9");
    expect(out).toEqual([{ id: "u1", name: "A" }, { id: "u2", name: "B" }]);
    out.forEach((m) => expect("phone" in m).toBe(false));
  });
  it("shows only shared phones to members", () => {
    expect(visibleMembers(pool, "u1")).toEqual([
      { id: "u1", name: "A" },
      { id: "u2", name: "B", phone: "222" },
    ]);
  });
});

describe("istDayRange", () => {
  it("is IST midnight to midnight", () => {
    const { start, end } = istDayRange("2026-10-24");
    expect(start.toISOString()).toBe("2026-10-23T18:30:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(24 * 3600 * 1000);
  });
});

describe("chatBlockReason", () => {
  it("lets a member of an active pool post", () => expect(chatBlockReason(openPool(), "u1", now)).toBeNull());
  it("blocks non-members", () => expect(chatBlockReason(openPool(), "u9", now)).toBe("not_member"));
  it("is read-only after a cancel", () => expect(chatBlockReason(openPool({ status: "cancelled" }), "u1", now)).toBe("ended"));
  it("is read-only once departEnd has passed", () =>
    expect(chatBlockReason(openPool({ departEnd: now }), "u1", now)).toBe("ended"));
  it("checks membership before ended", () =>
    expect(chatBlockReason(openPool({ status: "cancelled" }), "u9", now)).toBe("not_member"));
});

describe("canSeePool", () => {
  it("shows open pools to everyone", () => expect(canSeePool(openPool(), { gender: undefined })).toBe(true));
  it("shows women-only pools to women", () => expect(canSeePool(openPool({ womenOnly: true }), { gender: "female" })).toBe(true));
  it("hides them from men", () => expect(canSeePool(openPool({ womenOnly: true }), { gender: "male" })).toBe(false));
  it("hides them when gender is unset or unspecified", () => {
    expect(canSeePool(openPool({ womenOnly: true }), {})).toBe(false);
    expect(canSeePool(openPool({ womenOnly: true }), { gender: "unspecified" })).toBe(false);
  });
  it("shows a women-only pool to a male current member (plain ids)", () =>
    expect(canSeePool(openPool({ womenOnly: true, members: ["u1"] }), { _id: "u1", gender: "male" })).toBe(true));
  it("shows a women-only pool to a male current member (populated)", () =>
    expect(canSeePool(openPool({ womenOnly: true, members: [{ _id: "u1" }] }), { _id: "u1", gender: "male" })).toBe(true));
  it("still hides it from a male non-member", () =>
    expect(canSeePool(openPool({ womenOnly: true, members: ["u1"] }), { _id: "u9", gender: "male" })).toBe(false));
});

describe("googleAccountError", () => {
  it("accepts a verified college email", () =>
    expect(googleAccountError({ email: "a@vitapstudent.ac.in", email_verified: true })).toBeNull());
  it("rejects unverified", () =>
    expect(googleAccountError({ email: "a@vitapstudent.ac.in", email_verified: false })).toBe("unverified"));
  it("rejects other domains", () =>
    expect(googleAccountError({ email: "a@gmail.com", email_verified: true })).toBe("not_college"));
  it("rejects missing claims", () => expect(googleAccountError({})).toBe("unverified"));
});
