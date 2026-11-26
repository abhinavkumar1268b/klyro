export const COUNTRIES = [
  { code: "IN", name: "India", locale: "en-IN", currency: "INR" },
  { code: "US", name: "United States", locale: "en-US", currency: "USD" },
  { code: "GB", name: "United Kingdom", locale: "en-GB", currency: "GBP" },
  { code: "DE", name: "Germany", locale: "de-DE", currency: "EUR" },
  { code: "FR", name: "France", locale: "fr-FR", currency: "EUR" },
  { code: "AU", name: "Australia", locale: "en-AU", currency: "AUD" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const ACCENTS = [
  { value: "lime", label: "Lime", color: "#B9F36B" },
  { value: "mint", label: "Mint", color: "#6FE3C6" },
  { value: "sky", label: "Sky", color: "#7DD3FC" },
] as const;

export type AccentColor = (typeof ACCENTS)[number]["value"];

export const NOTIFICATION_PREFERENCES = [
  { key: "dailyReminders", label: "Daily reminders", description: "A nudge to log the day's spending." },
  { key: "budgetAlerts", label: "Budget alerts", description: "Warnings at your chosen thresholds." },
  { key: "weeklySummaries", label: "Weekly summaries", description: "A quiet review of the past week." },
  { key: "monthlySummaries", label: "Monthly summaries", description: "A once-a-month overview." },
  { key: "recurringReminders", label: "Recurring payment reminders", description: "Upcoming bills based on reminder lead time." },
] as const;
