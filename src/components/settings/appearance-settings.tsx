"use client";

import { AppearancePicker } from "./appearance-picker";
import { SettingsSection } from "./settings-section";

export function AppearanceSettings() {
  return (
    <SettingsSection
      title="Appearance"
      description="Dark by default. Choose a theme and accent that feel right."
    >
      <AppearancePicker />
    </SettingsSection>
  );
}
