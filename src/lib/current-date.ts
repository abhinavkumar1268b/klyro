import { localDateKey, msUntilNextLocalMidnight } from "./date";

export interface DateSnapshot {
  dateKey: string;
  timezoneOffset: number;
}

interface ClockConfig {
  now?: () => Date;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  onChange?: () => void;
}

export interface DateClock {
  getSnapshot: () => DateSnapshot;
  subscribe: (listener: () => void) => () => void;
  checkNow: () => void;
  dispose: () => void;
}

function readSnapshot(now: () => Date): DateSnapshot {
  const value = now();
  return {
    dateKey: localDateKey(value),
    timezoneOffset: value.getTimezoneOffset(),
  };
}

/**
 * Recalculates the wait until the next local midnight on every check.
 * Timers are only active while something is subscribed, and calling
 * `checkNow()` after a resume immediately detects a changed date or timezone.
 */
export function createDateClock(config: ClockConfig = {}): DateClock {
  const now = config.now ?? (() => new Date());
  const setTimer =
    config.setTimer ??
    ((callback: () => void, ms: number) => setTimeout(callback, ms));
  const clearTimer =
    config.clearTimer ?? ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));

  let snapshot = readSnapshot(now);
  let timer: unknown = null;
  let started = false;
  const listeners = new Set<() => void>();

  function schedule() {
    if (!started) return;
    if (timer !== null) clearTimer(timer);
    const ms = msUntilNextLocalMidnight(now());
    timer = setTimer(checkNow, Math.min(ms + 100, 2_147_483_647));
  }

  function checkNow() {
    timer = null;
    const next = readSnapshot(now);
    if (
      next.dateKey !== snapshot.dateKey ||
      next.timezoneOffset !== snapshot.timezoneOffset
    ) {
      snapshot = next;
      listeners.forEach((listener) => listener());
      config.onChange?.();
    }
    schedule();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (!started) {
      started = true;
      schedule();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        started = false;
        if (timer !== null) clearTimer(timer);
        timer = null;
      }
    };
  }

  return {
    getSnapshot: () => snapshot,
    subscribe,
    checkNow,
    dispose: () => {
      started = false;
      if (timer !== null) clearTimer(timer);
      timer = null;
      listeners.clear();
    },
  };
}

export const dateClock = createDateClock();
