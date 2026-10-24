import { describe, it, expect } from "vitest";
import {
  otpRequestSchema, registerSchema, loginSchema,
  createPoolSchema, joinSchema, shareSchema, messageSchema, accountSchema, googleCompleteSchema, resetPasswordSchema, parseBody,
} from "../lib/validation.js";

const now = new Date("2026-10-24T10:00:00Z");
const H = 3600 * 1000;
const iso = (ms) => new Date(now.getTime() + ms).toISOString();
const pool = (o = {}) => ({
  from: "campus", to: "airport", capacity: 3,
  departStart: iso(1 * H), departEnd: iso(2 * H), ...o,
});
const schema = createPoolSchema(now);
const reg = { email: " Demo1@VITAPSTUDENT.ac.in ", otp: "123456", name: " Ravi ", phone: "9876543210", password: "password1", gender: "female" };

describe("auth schemas", () => {
  it("register passes and lowercases email", () => {
    const r = parseBody(registerSchema, reg);
    expect(r.data.email).toBe("demo1@vitapstudent.ac.in");
    expect(r.data.name).toBe("Ravi");
  });
  it("rejects bad phone and otp", () => {
    expect(parseBody(registerSchema, { ...reg, phone: "5123456789" }).error).toBeTypeOf("string");
    expect(parseBody(registerSchema, { ...reg, otp: "12345" }).error).toBe("Code is 6 digits");
  });
  it("otp request rejects non-college email with exact message", () => {
    expect(parseBody(otpRequestSchema, { email: "x@gmail.com" }).error).toBe("Use your @vitapstudent.ac.in or @vitap.ac.in email");
  });
  it("login normalizes email", () => {
    expect(parseBody(loginSchema, { email: " A@B.com ", password: "x" }).data.email).toBe("a@b.com");
  });
});

describe("createPoolSchema", () => {
  it("accepts a valid pool and applies defaults", () => {
    const r = parseBody(schema, pool());
    expect(r.data.totalFare).toBe(400);
    expect(r.data.sharePhone).toBe(true);
    expect(r.data.departStart).toBeInstanceOf(Date);
  });
  it("rejects from === to", () => {
    expect(parseBody(schema, pool({ to: "campus" })).error).toBe("Pick two different places");
    expect(parseBody(schema, pool({ from: "railway", to: "airport" })).error).toBe("One end must be VIT-AP Campus");
    expect(parseBody(schema, pool({ from: "railway", to: "campus" })).data.to).toBe("campus");
  });
  it("rejects window of 3h 1min, allows 3h", () => {
    expect(parseBody(schema, pool({ departEnd: iso(1 * H + 3 * H + 60000) })).error).toBe("Pick a window of 3 hours or less");
    expect(parseBody(schema, pool({ departEnd: iso(4 * H) })).data).toBeDefined();
  });
  it("rejects end in the past", () => {
    expect(parseBody(schema, pool({ departStart: iso(-2 * H), departEnd: iso(-1 * H) })).error).toBe("That time has already passed");
  });
  it("rejects start 8 days out", () => {
    const s = 8 * 24 * H;
    expect(parseBody(schema, pool({ departStart: iso(s), departEnd: iso(s + H) })).error).toBe("You can only plan up to 7 days ahead");
  });
  it("rejects end before start", () => {
    expect(parseBody(schema, pool({ departEnd: iso(30 * 60000) })).error).toBeTypeOf("string");
  });
});

describe("join/share/parseBody", () => {
  it("joinSchema defaults sharePhone true", () => {
    expect(parseBody(joinSchema, {}).data.sharePhone).toBe(true);
  });
  it("shareSchema needs boolean", () => {
    expect(parseBody(shareSchema, { share: false }).data.share).toBe(false);
    expect(parseBody(shareSchema, {}).error).toBeTypeOf("string");
  });
  it("never throws on junk", () => {
    for (const d of [null, undefined, 5, "x", []]) {
      expect(parseBody(registerSchema, d).error).toBeTypeOf("string");
    }
  });
});

describe("messageSchema", () => {
  it("trims text", () => expect(parseBody(messageSchema, { text: "  hi  " }).data.text).toBe("hi"));
  it("rejects blank text", () => expect(parseBody(messageSchema, { text: "   " }).error).toBe("Type a message"));
  it("rejects over 500 chars", () =>
    expect(parseBody(messageSchema, { text: "a".repeat(501) }).error).toBe("Messages can be 500 characters at most"));
  it("accepts exactly 500", () => expect(parseBody(messageSchema, { text: "a".repeat(500) }).data).toBeTruthy());
});

describe("women-only schemas", () => {
  it("register needs a gender from the list", () => {
    expect(parseBody(registerSchema, { ...reg, gender: undefined }).error).toBe("Pick your gender");
    expect(parseBody(registerSchema, { ...reg, gender: "x" }).error).toBe("Pick your gender");
  });
  it("createPoolSchema defaults womenOnly to false", () =>
    expect(parseBody(schema, pool()).data.womenOnly).toBe(false));
  it("register accepts the three genders", () => {
    for (const gender of ["female", "male", "unspecified"]) expect(parseBody(registerSchema, { ...reg, gender }).data.gender).toBe(gender);
  });
  it("createPoolSchema keeps womenOnly: true", () =>
    expect(parseBody(schema, pool({ womenOnly: true })).data.womenOnly).toBe(true));
});

describe("googleCompleteSchema", () => {
  const g = { name: " Ravi ", phone: "9876543210", gender: "male", password: "password1" };
  it("rejects a 9-digit phone", () =>
    expect(parseBody(googleCompleteSchema, { ...g, phone: "987654321" }).error).toBe("Enter a 10-digit Indian mobile number"));
  it("needs a gender", () =>
    expect(parseBody(googleCompleteSchema, { ...g, gender: undefined }).error).toBe("Pick your gender"));
  it("needs a password of 8 or more", () =>
    expect(parseBody(googleCompleteSchema, { ...g, password: "short" }).error).toBe("Password needs at least 8 characters"));
  it("a missing password gets the same message", () =>
    expect(parseBody(googleCompleteSchema, { ...g, password: undefined }).error).toBe("Password needs at least 8 characters"));
  it("accepts a valid name, phone, gender and password", () =>
    expect(parseBody(googleCompleteSchema, g).data).toEqual({ ...g, name: "Ravi" }));
});

describe("password reset schemas", () => {
  const r = { email: " Demo1@VITAPSTUDENT.ac.in ", otp: "123456", password: "password1" };
  it("code request defaults to register", () =>
    expect(parseBody(otpRequestSchema, { email: "a@vitapstudent.ac.in" }).data.purpose).toBe("register"));
  it("code request accepts reset and rejects anything else", () => {
    expect(parseBody(otpRequestSchema, { email: "a@vitapstudent.ac.in", purpose: "reset" }).data.purpose).toBe("reset");
    expect(parseBody(otpRequestSchema, { email: "a@vitapstudent.ac.in", purpose: "x" }).error).toBeTypeOf("string");
  });
  it("reset lowercases the email", () =>
    expect(parseBody(resetPasswordSchema, r).data.email).toBe("demo1@vitapstudent.ac.in"));
  it("reset rejects a short password and a bad code", () => {
    expect(parseBody(resetPasswordSchema, { ...r, password: "short" }).error).toBe("Password needs at least 8 characters");
    expect(parseBody(resetPasswordSchema, { ...r, otp: "12" }).error).toBe("Code is 6 digits");
  });
});

describe("accountSchema", () => {
  it("trims the name and nickname and keeps the phone", () =>
    expect(parseBody(accountSchema, { name: " Ravi ", nickname: " RV ", phone: "9876543210" }).data)
      .toEqual({ name: "Ravi", nickname: "RV", phone: "9876543210" }));
  it("rejects a nickname under 2 or over 20 characters", () => {
    expect(parseBody(accountSchema, { name: "Ravi", nickname: "R", phone: "9876543210" }).error).toBe("Nickname needs at least 2 characters");
    expect(parseBody(accountSchema, { name: "Ravi", nickname: "R".repeat(21), phone: "9876543210" }).error).toBe("Nickname can be 20 characters at most");
  });
  it("drops gender, so it can't be changed after sign-up", () =>
    expect(parseBody(accountSchema, { name: "Ravi", nickname: "RV", phone: "9876543210", gender: "female" }).data.gender).toBeUndefined());
  it("rejects a bad phone", () =>
    expect(parseBody(accountSchema, { name: "Ravi", nickname: "RV", phone: "12345" }).error).toBe("Enter a 10-digit Indian mobile number"));
});
