/**
 * Central local-calendar date utilities.
 *
 * Transaction `date` values are always local calendar dates (YYYY-MM-DD).
 * `createdAt` / `updatedAt` remain accurate UTC timestamps. The two are kept
 * deliberately separate so grouping never depends on UTC conversion.
 */

export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localMonthKey(date: Date = new Date()): string {
  return localDateKey(date).slice(0, 7);
}

/** Parses a local calendar date without the UTC shift of `new Date('YYYY-MM-DD')`. */
export function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function localDateKeyFromTimestamp(timestamp: string): string {
  return localDateKey(new Date(timestamp));
}

export function isSameLocalDay(a: Date | string, b: Date | string): boolean {
  const first = typeof a === "string" ? parseLocalDateKey(a) : a;
  const second = typeof b === "string" ? parseLocalDateKey(b) : b;
  return localDateKey(first) === localDateKey(second);
}

/** The next local midnight, recalculated for DST (23/24/25-hour days). */
export function nextLocalMidnight(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  return Math.max(1, nextLocalMidnight(now).getTime() - now.getTime());
}

export function shiftLocalDateKey(key: string, days: number): string {
  const date = parseLocalDateKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function shiftLocalMonthKey(key: string, months: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return localMonthKey(date);
}

export function localNow(): { dateKey: string; timestamp: string } {
  const now = new Date();
  return { dateKey: localDateKey(now), timestamp: now.toISOString() };
}
