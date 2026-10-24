import { describe, it, expect } from "vitest";
import { otpEmail } from "../lib/mail.js";

describe("otpEmail", () => {
  it("puts the code in the subject, text and html", () => {
    const m = otpEmail("246810", "register");
    expect(m.subject).toBe("Your PoolUp sign-up code: 246810");
    expect(m.text).toContain("246810");
    expect(m.html).toContain("246810");
  });
  it("words a reset email differently", () => {
    const m = otpEmail("135790", "reset");
    expect(m.subject).toBe("Reset your PoolUp password: 135790");
    expect(m.html).toContain("Reset your password");
  });
  it("defaults to sign-up wording", () => expect(otpEmail("111111").subject).toContain("sign-up"));
});
