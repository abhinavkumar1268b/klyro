"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { ACCENTS, type AccentColor } from "@/constants/settings";
import { useSettingsStore, type Appearance } from "@/stores/settings-store";
import { cn } from "@/lib/utils";

const APPEARANCES: Array<{
  value: Appearance;
  label: string;
  description: string;
  icon: typeof Moon;
}> = [
  { value: "dark", label: "Dark", description: "The signature KLYRO look", icon: Moon },
  { value: "light", label: "Light", description: "Bright, high-contrast surfaces", icon: Sun },
  { value: "system", label: "System", description: "Follow your device setting", icon: Monitor },
];

export function AppearancePicker({ compact = false }: { compact?: boolean }) {
  const appearance = useSettingsStore((state) => state.appearance);
  const setAppearance = useSettingsStore((state) => state.setAppearance);
  const accent = useSettingsStore((state) => state.accent);
  const setAccent = useSettingsStore((state) => state.setAccent);

  return (
    <div className="space-y-5">
      <div className={cn("grid gap-3", !compact && "sm:grid-cols-3")}>
        {APPEARANCES.map((option) => {
          const Icon = option.icon;
          const active = appearance === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setAppearance(option.value)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-elevated/40 hover:bg-elevated",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                {!compact ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {active ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      {!compact ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Accent colour</p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((option) => {
              const active = accent === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccent(option.value as AccentColor)}
                  aria-label={`${option.label} accent`}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border bg-elevated/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className="size-4 rounded-full border border-black/10"
                    style={{ background: option.color }}
                    aria-hidden="true"
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
