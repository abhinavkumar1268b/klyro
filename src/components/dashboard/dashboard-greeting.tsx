"use client";

import { useCurrentDate, useMounted } from "@/hooks";
import { useSettingsStore } from "@/stores";

export function DashboardGreeting() {
  const mounted = useMounted();
  const currentDate = useCurrentDate();
  const displayName = useSettingsStore((state) => state.displayName);

  const hour = mounted && currentDate ? new Date().getHours() : 9;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {greeting}, {displayName}.
    </>
  );
}
