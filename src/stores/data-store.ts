"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DataMode = "demo" | "live";

interface DataModeState {
  mode: DataMode;
  onboardingComplete: boolean;
  setMode: (mode: DataMode) => void;
  completeOnboarding: (mode: DataMode) => void;
  reopenOnboarding: () => void;
}

/**
 * Demo mode keeps everything in memory. Live mode uses IndexedDB only.
 * No sample record is ever written to the real database implicitly.
 */
export const useDataStore = create<DataModeState>()(
  persist(
    (set) => ({
      mode: "demo",
      onboardingComplete: false,
      setMode: (mode) => set({ mode }),
      completeOnboarding: (mode) => set({ mode, onboardingComplete: true }),
      reopenOnboarding: () => set({ onboardingComplete: false }),
    }),
    { name: "klyro-data-mode", skipHydration: true },
  ),
);
