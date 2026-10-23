import { describe, it, expect } from "vitest";
import { formatTime } from "../lib/client.js";

describe("formatTime", () => {
  it("shows IST, not UTC", () => {
    expect(formatTime("2026-10-24T11:30:00Z")).toBe("Sat 24 Oct, 5:00 pm");
  });

  it("handles midnight and morning", () => {
    expect(formatTime(new Date("2026-10-23T18:30:00Z"))).toBe("Sat 24 Oct, 12:00 am");
    expect(formatTime("2026-10-24T03:35:00Z")).toBe("Sat 24 Oct, 9:05 am");
  });
});
