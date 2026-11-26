import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/constants/app";
import { COUNTRIES } from "@/constants/settings";
import { localDateKey, localMonthKey, parseLocalDateKey } from "@/lib/date";
import { useSettingsStore } from "@/stores/settings-store";

function currentCurrency(): string {
  return useSettingsStore.getState().currency || DEFAULT_CURRENCY;
}

function currentLocale(currency: string): string {
  const country = useSettingsStore.getState().country;
  const match = COUNTRIES.find((item) => item.code === country);
  if (match && match.currency === currency) return match.locale;
  if (currency === "USD") return "en-US";
  if (currency === "EUR") return "de-DE";
  if (currency === "GBP") return "en-GB";
  if (currency === "AUD") return "en-AU";
  return DEFAULT_LOCALE;
}

function displayLocale(): string {
  return COUNTRIES.find((item) => item.code === useSettingsStore.getState().country)?.locale ?? DEFAULT_LOCALE;
}

/** Convert a major-unit amount (e.g. 1250.50) to integer minor units. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Convert integer minor units back to major units. */
export function fromMinorUnits(amount: number): number {
  return amount / 100;
}

export function formatCurrency(
  minorUnits: number,
  currency: string = currentCurrency(),
  locale: string = currentLocale(currency),
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: useSettingsStore.getState().showCents ? 2 : 0,
    maximumFractionDigits: useSettingsStore.getState().showCents ? 2 : 0,
  }).format(fromMinorUnits(minorUnits));
}

export function formatCompactCurrency(
  minorUnits: number,
  currency: string = currentCurrency(),
  locale: string = currentLocale(currency),
  maximumFractionDigits = 1,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits,
  }).format(fromMinorUnits(minorUnits));
}

export function formatDate(date: string, locale: string = displayLocale()): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseLocalDateKey(date));
}

export function formatMonth(month: string, locale: string = displayLocale()): string {
  const [year, monthNumber] = month.split("-");
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(Number(year), Number(monthNumber) - 1, 1),
  );
}

/** `YYYY-MM` key for a date string or Date instance. */
export function getMonthKey(value: string | Date = new Date()): string {
  return value instanceof Date ? localMonthKey(value) : localMonthKey(parseLocalDateKey(value));
}

export function isoDate(date: Date): string {
  return localDateKey(date);
}

export function todayISO(): string {
  return localDateKey();
}
