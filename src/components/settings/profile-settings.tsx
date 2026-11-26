"use client";

import { COUNTRIES, type CountryCode } from "@/constants/settings";
import { useSettingsStore, type CurrencyCode, type WeekStart } from "@/stores/settings-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SettingsSection } from "./settings-section";
import { notify } from "@/stores/toast-store";
import type { TransactionClassification } from "@/types";

const WEEK_OPTIONS = [
  { value: "monday" as WeekStart, label: "Monday" },
  { value: "sunday" as WeekStart, label: "Sunday" },
];

const CLASS_OPTIONS = [
  { value: "need" as TransactionClassification, label: "Need" },
  { value: "want" as TransactionClassification, label: "Want" },
];

export function ProfileSettings() {
  const settings = useSettingsStore();
  const country = COUNTRIES.find((item) => item.code === settings.country) ?? COUNTRIES[0];

  return (
    <div className="space-y-5">
      <SettingsSection title="Profile" description="How KLYRO greets you and formats your money.">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Display name</Label>
            <Input
              id="settings-name"
              value={settings.displayName}
              onChange={(event) => settings.setDisplayName(event.target.value)}
              maxLength={32}
              placeholder="Your name"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-country">Country</Label>
              <Select
                id="settings-country"
                value={settings.country}
                onChange={(event) => {
                  const code = event.target.value as CountryCode;
                  settings.setCountry(code);
                  const match = COUNTRIES.find((item) => item.code === code);
                  if (match) settings.setCurrency(match.currency as CurrencyCode);
                }}
              >
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-currency">Currency</Label>
              <Select
                id="settings-currency"
                value={settings.currency}
                onChange={(event) => {
                  settings.setCurrency(event.target.value as CurrencyCode);
                  notify({ variant: "success", title: "Currency updated" });
                }}
              >
                {["INR", "USD", "EUR", "GBP", "AUD"].map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Dates use the {country.locale} format. Currency is stored with your settings.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Financial preferences"
        description="Small choices that shape your numbers."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Week starts on</Label>
            <SegmentedControl
              options={WEEK_OPTIONS}
              value={settings.weekStartsOn}
              onChange={settings.setWeekStartsOn}
              ariaLabel="Week starts on"
            />
          </div>
          <div className="space-y-2">
            <Label>Default expense classification</Label>
            <SegmentedControl
              options={CLASS_OPTIONS}
              value={settings.defaultClassification}
              onChange={(value) => settings.setDefaultClassification(value)}
              ariaLabel="Default classification"
            />
            <p className="text-xs text-muted-foreground">
              Applied to new expenses; you can still choose need or want each time.
            </p>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3.5">
            <span>
              <span className="block text-sm font-medium text-foreground">Show cents</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Display two decimal places on every amount.
              </span>
            </span>
            <input
              type="checkbox"
              className="size-4 accent-current text-primary"
              checked={settings.showCents}
              onChange={(event) => settings.setShowCents(event.target.checked)}
            />
          </label>
        </div>
      </SettingsSection>
    </div>
  );
}
