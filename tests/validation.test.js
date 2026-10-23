import { describe, it, expect } from "vitest";
import {
  otpRequestSchema, registerSchema, loginSchema,
  createPoolSchema, joinSchema, shareSchema, parseBody,
} from "../lib/validation.js";

const now = new Date("2026-10-24T10:00:00Z");
const H = 3600 * 1000;
const iso = (ms) => new Date(now.getTime() + ms).toISOString();
const pool = (o = {}) => ({
  from: "campus", to: "airport", capacity: 3,
  departStart: iso(1 * H), departEnd: iso(2 * H), ...o,
});
const schema = createPoolSchema(now);

describe("auth schemas", () => {
  const reg = { email: " Demo1@VITAPSTUDENT.ac.in ", otp: "123456", name: " Ravi ", phone: "9876543210", password: "password1" };
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
