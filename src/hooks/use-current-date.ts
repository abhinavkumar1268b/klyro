"use client";

import { useSyncExternalStore } from "react";
import { dateClock, type DateSnapshot } from "@/lib/current-date";

const RESUME_EVENTS = [
  "visibilitychange",
  "focus",
  "pageshow",
  "online",
  "orientationchange",
  "resume",
] as const;

function subscribe(listener: () => void) {
  const unsubscribe = dateClock.subscribe(listener);
  const verify = () => dateClock.checkNow();

  RESUME_EVENTS.forEach((event) => window.addEventListener(event, verify));
  window.addEventListener("pagehide", verify);

  return () => {
    RESUME_EVENTS.forEach((event) => window.removeEventListener(event, verify));
    window.removeEventListener("pagehide", verify);
    unsubscribe();
  };
}

/**
 * Reactive local calendar date. Updates at midnight, on timezone changes and
 * whenever the PWA/tab resumes, without reloading the application.
 */
export function useCurrentDate(): DateSnapshot | null {
  return useSyncExternalStore(
    subscribe,
    () => dateClock.getSnapshot(),
    () => null,
  );
}
