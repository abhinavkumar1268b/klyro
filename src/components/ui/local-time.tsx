"use client";

import { useMounted } from "@/hooks";
import { formatLocalTime } from "@/lib/calculations";

/** Timestamps are rendered only after hydration to avoid UTC/local timezone mismatch. */
export function LocalTime({
  timestamp,
  className,
}: {
  timestamp: string;
  className?: string;
}) {
  const mounted = useMounted();
  return (
    <span className={className} suppressHydrationWarning>
      {mounted ? formatLocalTime(timestamp) : "—"}
    </span>
  );
}
