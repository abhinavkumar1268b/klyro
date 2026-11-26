"use client";

import { NOTIFICATION_PREFERENCES } from "@/constants/settings";
import { useSettingsStore, type NotificationPreferences } from "@/stores/settings-store";
import { SettingsSection } from "./settings-section";
import { cn } from "@/lib/utils";

export function NotificationSettings() {
  const notifications = useSettingsStore((state) => state.notifications);
  const setNotification = useSettingsStore((state) => state.setNotification);

  return (
    <SettingsSection
      title="Notifications"
      description="Choose which quiet signals appear in your notification centre."
    >
      <div className="space-y-2">
        {NOTIFICATION_PREFERENCES.map((item) => {
          const key = item.key as keyof NotificationPreferences;
          const enabled = notifications[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setNotification(key, !enabled)}
              aria-pressed={enabled}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-lg border p-3.5 text-left transition-colors",
                enabled
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-elevated/40 hover:bg-elevated",
              )}
            >
              <span>
                <span className="block text-sm font-medium text-foreground">{item.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  enabled ? "bg-primary" : "bg-elevated",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 size-4 rounded-full bg-background transition-transform",
                    enabled ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        These are in-app summaries only. KLYRO never sends a push notification or email.
      </p>
    </SettingsSection>
  );
}
