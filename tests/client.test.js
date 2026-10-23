import { describe, it, expect } from "vitest";
import { formatTime, formatWindow, nextIstDays } from "../lib/client.js";

describe("formatTime", () => {
  it("shows IST, not UTC", () => {
    expect(formatTime("2026-10-24T11:30:00Z")).toBe("Sat 24 Oct, 5:00 pm");
  });

  it("handles midnight and morning", () => {
    expect(formatTime(new Date("2026-10-23T18:30:00Z"))).toBe("Sat 24 Oct, 12:00 am");
    expect(formatTime("2026-10-24T03:35:00Z")).toBe("Sat 24 Oct, 9:05 am");
  });
});

describe("formatWindow", () => {
  it("shows the day once when start and end share an IST day", () => {
    expect(formatWindow("2026-10-24T10:30:00Z", "2026-10-24T11:00:00Z")).toBe("Sat 24 Oct, 4:00 pm – 4:30 pm");
  });

  it("repeats the day when the window crosses IST midnight", () => {
    expect(formatWindow("2026-10-24T18:00:00Z", "2026-10-24T19:00:00Z")).toBe("Sat 24 Oct, 11:30 pm – Sun 25 Oct, 12:30 am");
  });
});

describe("nextIstDays", () => {
  it("uses IST dates even when UTC is still on the previous day", () => {
    const days = nextIstDays(new Date("2026-10-23T20:00:00Z")); // 1:30 am Sat in IST
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ value: "2026-10-24", label: "Today" });
    expect(days[2]).toEqual({ value: "2026-10-26", label: "Mon 26 Oct" });
  });
});
