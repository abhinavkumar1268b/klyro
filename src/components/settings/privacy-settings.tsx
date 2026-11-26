"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { resetAllData } from "@/lib/export";
import { notify } from "@/stores/toast-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SettingsSection } from "./settings-section";

export function PrivacySettings() {
  const [confirm, setConfirm] = useState(false);

  async function clearData() {
    try {
      await resetAllData();
      notify({ variant: "success", title: "All local data deleted" });
      setConfirm(false);
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Could not clear data" });
    }
  }

  return (
    <SettingsSection title="Privacy & security" description="Nothing about your money leaves this device.">
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <div className="flex gap-3 rounded-lg border border-border bg-elevated/40 p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            KLYRO is local-first. Transactions, budgets, goals, categories, reminders and preferences
            are stored in IndexedDB in this browser. There is no account, no server and no analytics
            on your financial data.
          </p>
        </div>
        <p>
          No financial information is ever transmitted to an external service by this application.
          You can export a JSON backup or CSV file at any time; those files stay on your device
          until you choose to share them.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs">Deleting local data is permanent unless you have a backup.</p>
          <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
            Delete all local data
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete all local data?"
        description="Every record stored in this browser will be permanently erased. This action cannot be undone."
        confirmLabel="Delete everything"
        variant="danger"
        onConfirm={clearData}
      />
    </SettingsSection>
  );
}
