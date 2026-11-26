"use client";

import { APP_NAME, APP_TAGLINE } from "@/constants";
import { SettingsSection } from "./settings-section";
import { ProfileSettings } from "./profile-settings";
import { BudgetSettings } from "./budget-settings";
import { CategorySettings } from "./category-settings";
import { AppearanceSettings } from "./appearance-settings";
import { NotificationSettings } from "./notification-settings";
import { DataSettings } from "./data-settings";
import { PrivacySettings } from "./privacy-settings";

export function SettingsView() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        <ProfileSettings />
        <BudgetSettings />
        <CategorySettings />
      </div>
      <div className="space-y-5">
        <AppearanceSettings />
        <NotificationSettings />
        <DataSettings />
        <PrivacySettings />
        <SettingsSection title="About" description="A quiet companion for your money.">
          <div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Application</span>
              <span className="text-foreground">
                {APP_NAME} · {APP_TAGLINE}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="text-foreground">0.1.0</span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
