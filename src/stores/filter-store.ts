"use client";

import { create } from "zustand";
import type { DateRange, DateRangePreset, TransactionType } from "@/types";

interface FilterState {
  dateRange: DateRange;
  type: TransactionType | "all";
  categoryId: string | "all";
  search: string;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (from?: string, to?: string) => void;
  setType: (type: TransactionType | "all") => void;
  setCategory: (categoryId: string | "all") => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

const initialState = {
  dateRange: { preset: "this-month" as DateRangePreset },
  type: "all" as TransactionType | "all",
  categoryId: "all",
  search: "",
};

/** Transaction list / insight filters. Data itself stays in Dexie. */
export const useFilterStore = create<FilterState>()((set) => ({
  ...initialState,
  setPreset: (preset) => set({ dateRange: { preset } }),
  setCustomRange: (from, to) => set({ dateRange: { preset: "custom", from, to } }),
  setType: (type) => set({ type }),
  setCategory: (categoryId) => set({ categoryId }),
  setSearch: (search) => set({ search }),
  reset: () => set(initialState),
}));
