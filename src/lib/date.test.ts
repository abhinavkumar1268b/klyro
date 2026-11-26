import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSameLocalDay,
  localDateKey,
  localDateKeyFromTimestamp,
  msUntilNextLocalMidnight,
  nextLocalMidnight,
  parseLocalDateKey,
  shiftLocalDateKey,
  shiftLocalMonthKey,
} from "./date";

const originalTZ = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTZ;
  vi.useRealTimers();
});

function useTZ(tz: string) {
  process.env.TZ = tz;
}

describe("local calendar date", () => {
  it("uses the device timezone, never the UTC date", () => {
    useTZ("Asia/Kolkata");
    const timestamp = "2026-11-26T18:30:00.000Z"; // 00:00 next day in India
    expect(localDateKeyFromTimestamp(timestamp)).toBe("2026-11-27");

    useTZ("America/New_York");
    expect(localDateKeyFromTimestamp(timestamp)).toBe("2026-11-26");
  });

  it("parses YYYY-MM-DD as local midnight without a UTC shift", () => {
    useTZ("Asia/Tokyo");
    const parsed = parseLocalDateKey("2026-11-26");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(10);
    expect(parsed.getDate()).toBe(26);
    expect(localDateKey(parsed)).toBe("2026-11-26");
  });

  it("compares local days across timezones", () => {
    useTZ("UTC");
    expect(isSameLocalDay("2026-11-26", new Date(2026, 10, 26, 23, 59))).toBe(true);
    expect(isSameLocalDay("2026-11-26", "2026-11-27")).toBe(false);
  });

  it("shifts dates across months, years and leap days", () => {
    expect(shiftLocalDateKey("2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftLocalDateKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftLocalDateKey("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftLocalMonthKey("2026-12", 1)).toBe("2027-01");
    expect(localDateKey(parseLocalDateKey("2028-02-29"))).toBe("2028-02-29");
  });
});

describe("next local midnight", () => {
  it("recalculates the remaining time instead of assuming 24 hours", () => {
    useTZ("UTC");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 26, 23, 59, 50));
    expect(msUntilNextLocalMidnight()).toBe(10_000);
    expect(nextLocalMidnight().getDate()).toBe(27);

    vi.setSystemTime(new Date(2026, 10, 27, 0, 0, 1));
    expect(msUntilNextLocalMidnight()).toBe(24 * 60 * 60 * 1000 - 1_000);
  });

  it("handles a 23-hour DST spring-forward day", () => {
    useTZ("America/New_York");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 8, 0, 0, 0));
    expect(msUntilNextLocalMidnight()).toBe(23 * 60 * 60 * 1000);
    expect(nextLocalMidnight().getDate()).toBe(9);
  });

  it("handles a 25-hour DST fall-back day", () => {
    useTZ("America/New_York");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 0, 0, 0));
    expect(msUntilNextLocalMidnight()).toBe(25 * 60 * 60 * 1000);
  });

  it("assigns boundary times to the correct local calendar date", () => {
    useTZ("Asia/Kolkata");
    const boundaries: Array<[Date, string]> = [
      [new Date(2026, 10, 26, 23, 59, 0), "2026-11-26"],
      [new Date(2026, 10, 26, 23, 59, 59), "2026-11-26"],
      [new Date(2026, 10, 27, 0, 0, 0), "2026-11-27"],
      [new Date(2026, 10, 27, 0, 0, 1), "2026-11-27"],
      [new Date(2026, 10, 27, 12, 0, 0), "2026-11-27"],
    ];
    for (const [date, expected] of boundaries) {
      expect(localDateKey(date)).toBe(expected);
    }
  });
});
