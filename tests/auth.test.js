import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashSecret,
  verifySecret,
  signSession,
  readSession,
} from "../lib/auth.js";

process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";

describe("generateOtp", () => {
  it("is always 6 digits", () => {
    for (let i = 0; i < 100; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });
});

describe("hashSecret / verifySecret", () => {
  it("accepts the right value and rejects a wrong one", async () => {
    const hash = await hashSecret("123456");
    expect(await verifySecret("123456", hash)).toBe(true);
    expect(await verifySecret("654321", hash)).toBe(false);
  });
});

describe("sessions", () => {
  it("round-trips the user id", async () => {
    expect(await readSession(await signSession("abc"))).toBe("abc");
  });
  it("returns null for garbage", async () => {
    expect(await readSession("garbage")).toBeNull();
  });
});
