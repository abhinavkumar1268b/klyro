"use client";

import { useEffect, type ReactNode } from "react";
import { registerServiceWorker } from "@/lib/pwa";
import { useDatabaseInit, useMediaQuery, useRecurringProcessor } from "@/hooks";
import { markHydrated } from "@/stores/hydration-store";
import {
  useDataStore,
  useSettingsStore,
  useUIStore,
} from "@/stores";
import { Onboarding } from "./onboarding";

/** Cross-cutting client setup: persistence, local database, theme and PWA. */
export function Providers({ children }: { children: ReactNode }) {
  const appearance = useSettingsStore((state) => state.appearance);
  const accent = useSettingsStore((state) => state.accent);
  const systemLight = useMediaQuery("(prefers-color-scheme: light)");
  useDatabaseInit();
  useRecurringProcessor();

  useEffect(() => {
    void Promise.all([
      useUIStore.persist.rehydrate(),
      useDataStore.persist.rehydrate(),
      useSettingsStore.persist.rehydrate(),
    ]).then(markHydrated);
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const resolved = appearance === "system" ? (systemLight ? "light" : "dark") : appearance;
    document.documentElement.dataset.appearance = resolved;
    document.documentElement.dataset.accent = accent;
  }, [appearance, accent, systemLight]);

  return (
    <>
      {children}
      <Onboarding />
    </>
  );
}
