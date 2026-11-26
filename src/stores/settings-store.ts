"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CURRENCY } from "@/constants";
import type { AccentColor, CountryCode } from "@/constants/settings";
import type { TransactionClassification } from "@/types";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AUD";
export type Appearance = "dark" | "light" | "system";
export type WeekStart = "monday" | "sunday";

export interface NotificationPreferences {
  dailyReminders: boolean;
  budgetAlerts: boolean;
  weeklySummaries: boolean;
  monthlySummaries: boolean;
  recurringReminders: boolean;
}

interface SettingsState {
  displayName: string;
  currency: CurrencyCode;
  country: CountryCode;
  appearance: Appearance;
  accent: AccentColor;
  weekStartsOn: WeekStart;
  showCents: boolean;
  defaultClassification: TransactionClassification;
  notifications: NotificationPreferences;
  setDisplayName: (name: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setCountry: (country: CountryCode) => void;
  setAppearance: (appearance: Appearance) => void;
  setAccent: (accent: AccentColor) => void;
  setWeekStartsOn: (weekStartsOn: WeekStart) => void;
  setShowCents: (showCents: boolean) => void;
  setDefaultClassification: (classification: TransactionClassification) => void;
  setNotification: (key: keyof NotificationPreferences, value: boolean) => void;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  dailyReminders: true,
  budgetAlerts: true,
  weeklySummaries: true,
  monthlySummaries: true,
  recurringReminders: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      displayName: "Aarav",
      currency: DEFAULT_CURRENCY as CurrencyCode,
      country: "IN",
      appearance: "dark",
      accent: "lime",
      weekStartsOn: "monday",
      showCents: false,
      defaultClassification: "need",
      notifications: DEFAULT_NOTIFICATIONS,
      setDisplayName: (displayName) => set({ displayName }),
      setCurrency: (currency) => set({ currency }),
      setCountry: (country) => set({ country }),
      setAppearance: (appearance) => set({ appearance }),
      setAccent: (accent) => set({ accent }),
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
      setShowCents: (showCents) => set({ showCents }),
      setDefaultClassification: (defaultClassification) => set({ defaultClassification }),
      setNotification: (key, value) =>
        set((state) => ({ notifications: { ...state.notifications, [key]: value } })),
    }),
    { name: "klyro-settings", skipHydration: true },
  ),
);
