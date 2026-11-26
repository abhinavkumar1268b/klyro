import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { SettingsView } from "@/components/settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Make KLYRO yours. Everything here stays on this device."
      />
      <SettingsView />
    </div>
  );
}
