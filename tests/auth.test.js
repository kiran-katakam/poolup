import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashSecret,
  verifySecret,
  signSession,
  signGoogleSignup,
  readGoogleSignup,
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
  it("returns null for a token signed with a different secret", async () => {
    const token = await signSession("abc");
    process.env.JWT_SECRET = "another-secret-at-least-32-characters";
    expect(await readSession(token)).toBeNull();
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
  });
  it("signSession fails loudly when JWT_SECRET is missing", async () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    await expect(signSession("abc")).rejects.toThrow("JWT_SECRET is not set");
    process.env.JWT_SECRET = saved;
  });
});

describe("google signup token", () => {
  it("round-trips email and name", async () =>
    expect(await readGoogleSignup(await signGoogleSignup({ email: "a@vitap.ac.in", name: "A" })))
      .toEqual({ email: "a@vitap.ac.in", name: "A" }));
  it("is not a session", async () =>
    expect(await readSession(await signGoogleSignup({ email: "a@vitap.ac.in", name: "A" }))).toBeNull());
  it("a session is not a signup token", async () =>
    expect(await readGoogleSignup(await signSession("507f1f77bcf86cd799439011"))).toBeNull());
  it("a tampered token is rejected", async () => {
    const t = await signGoogleSignup({ email: "a@vitap.ac.in", name: "A" });
    const bad = t.slice(0, -1) + (t.endsWith("A") ? "B" : "A");
    expect(await readGoogleSignup(bad)).toBeNull();
  });
});
