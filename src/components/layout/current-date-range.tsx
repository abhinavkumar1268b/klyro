"use client";

import { useCurrentDate } from "@/hooks";
import { parseLocalDateKey } from "@/lib/date";

/** Stable after hydration; shows the month the current view is scoped to. */
export function CurrentDateRange({ prefix = "This month" }: { prefix?: string }) {
  const currentDate = useCurrentDate();
  if (!currentDate) return <span>{prefix}</span>;

  const date = parseLocalDateKey(currentDate.dateKey);
  const label = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <span>
      {prefix} · 1 – {label.format(date)}
    </span>
  );
}
