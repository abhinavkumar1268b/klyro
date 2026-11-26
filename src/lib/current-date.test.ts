import { describe, expect, it, vi } from "vitest";
import { createDateClock } from "./current-date";

interface Timer {
  id: number;
  callback: () => void;
  ms: number;
}

function harness(initial: Date) {
  let current = new Date(initial);
  let offset = current.getTimezoneOffset();
  let timers: Timer[] = [];
  let nextId = 0;
  const onChange = vi.fn();

  const now = () => {
    current.getTimezoneOffset = () => offset;
    return current;
  };

  const clock = createDateClock({
    now,
    setTimer: (callback, ms) => {
      const id = ++nextId;
      timers.push({ id, callback, ms });
      return id;
    },
    clearTimer: (handle) => {
      timers = timers.filter((timer) => timer.id !== handle);
    },
    onChange,
  });

  return {
    clock,
    onChange,
    setNow: (date: Date) => {
      current = new Date(date);
      offset = current.getTimezoneOffset();
    },
    setOffset: (value: number) => {
      offset = value;
    },
    fireTimers: () => {
      const due = timers;
      timers = [];
      due.forEach((timer) => timer.callback());
    },
    scheduled: () => timers,
  };
}

describe("midnight rollover clock", () => {
  it("detects the date change exactly at local midnight and notifies once", () => {
    const h = harness(new Date(2026, 10, 26, 23, 59, 50));
    const listener = vi.fn();
    const unsubscribe = h.clock.subscribe(listener);

    expect(h.clock.getSnapshot().dateKey).toBe("2026-11-26");
    expect(h.scheduled()[0].ms).toBe(10_100);

    h.setNow(new Date(2026, 10, 27, 0, 0, 0));
    h.fireTimers();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(onChangeMock(h)).toHaveBeenCalledTimes(1);
    expect(h.clock.getSnapshot().dateKey).toBe("2026-11-27");
    expect(h.scheduled()).toHaveLength(1);

    h.fireTimers();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("recalculates the timer after a late or throttled wake-up", () => {
    const h = harness(new Date(2026, 10, 26, 23, 59, 59));
    h.clock.subscribe(vi.fn());
    h.setNow(new Date(2026, 10, 27, 12, 5, 0));
    h.fireTimers();

    expect(h.clock.getSnapshot().dateKey).toBe("2026-11-27");
    expect(h.scheduled()[0].ms).toBeGreaterThan(11 * 60 * 60 * 1000);
  });

  it("updates immediately on resume without a timer", () => {
    const h = harness(new Date(2026, 10, 26, 22, 0, 0));
    const listener = vi.fn();
    h.clock.subscribe(listener);
    h.setNow(new Date(2026, 10, 27, 8, 0, 0));
    h.clock.checkNow();

    expect(h.clock.getSnapshot().dateKey).toBe("2026-11-27");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("detects timezone changes even when the calendar date is unchanged", () => {
    const h = harness(new Date("2026-11-26T12:00:00Z"));
    const listener = vi.fn();
    h.clock.subscribe(listener);
    const before = h.clock.getSnapshot();

    // Simulate a device timezone change with the same calendar date.
    h.setOffset(before.timezoneOffset + 60);
    h.clock.checkNow();

    expect(h.clock.getSnapshot().timezoneOffset).toBe(before.timezoneOffset + 60);
    expect(h.clock.getSnapshot().dateKey).toBe(before.dateKey);
    expect(listener).toHaveBeenCalled();
  });

  it("clears timers when the last subscriber leaves", () => {
    const h = harness(new Date(2026, 10, 26, 12, 0, 0));
    const unsubscribe = h.clock.subscribe(vi.fn());
    expect(h.scheduled()).toHaveLength(1);
    unsubscribe();
    expect(h.scheduled()).toHaveLength(0);
  });
});

function onChangeMock(h: ReturnType<typeof harness>) {
  return h.onChange;
}
