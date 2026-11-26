"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after hydration — useful for portal-only UI. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
