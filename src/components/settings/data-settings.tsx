"use client";

import { useRef, useState } from "react";
import {
  Database,
  Download,
  FileJson,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { exportAllData, resetAllData, restoreBackup } from "@/lib/export";
import { downloadCSV, transactionsToCSV } from "@/lib/export";
import { parseBackup, type BackupPayload } from "@/lib/validation";
import { importDemoIntoLive, useDemoStore } from "@/stores/demo-store";
import { useDataStore, type DataMode } from "@/stores/data-store";
import { useTransactions } from "@/hooks";
import { notify } from "@/stores/toast-store";
import { todayISO } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SettingsSection } from "./settings-section";
import { cn } from "@/lib/utils";

type ConfirmAction = "mode" | "import-samples" | "import-backup" | "reset";

export function DataSettings() {
  const { data: transactions } = useTransactions();
  const mode = useDataStore((state) => state.mode);
  const setMode = useDataStore((state) => state.setMode);
  const reopenOnboarding = useDataStore((state) => state.reopenOnboarding);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const fileRef = useRef<HTMLInputElement>(null);

  const [pendingMode, setPendingMode] = useState<DataMode | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [backup, setBackup] = useState<BackupPayload | null>(null);

  async function exportCSV() {
    downloadCSV(`klyro-transactions-${todayISO()}.csv`, transactionsToCSV(transactions));
    notify({ variant: "success", title: "Transactions exported" });
  }

  async function exportJSON() {
    if (mode === "demo") {
      notify({
        variant: "info",
        title: "Exporting your local journal",
        description: "Sample data is in memory and is not part of this backup.",
      });
    }
    try {
      await exportAllData();
      notify({ variant: "success", title: "Backup downloaded" });
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Could not export backup" });
    }
  }

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const parsed = parseBackup(text);
      setBackup(parsed);
      setConfirmAction("import-backup");
    } catch (error) {
      console.error(error);
      setBackup(null);
      notify({
        variant: "error",
        title: "Invalid backup file",
        description: "Nothing was changed. Choose a KLYRO JSON backup.",
      });
    }
  }

  async function handleConfirm() {
    try {
      if (confirmAction === "mode" && pendingMode) {
        if (pendingMode === "demo") resetDemo();
        setMode(pendingMode);
        notify({ variant: "success", title: `Switched to ${pendingMode === "demo" ? "sample" : "your own"} data` });
      }
      if (confirmAction === "import-samples") {
        await importDemoIntoLive();
        setMode("live");
        notify({ variant: "success", title: "Samples imported into your journal" });
      }
      if (confirmAction === "import-backup" && backup) {
        await restoreBackup(backup);
        setMode("live");
        notify({
          variant: "success",
          title: "Backup restored",
          description: `${backup.transactions.length} transactions recovered.`,
        });
        setBackup(null);
      }
      if (confirmAction === "reset") {
        await resetAllData();
        notify({ variant: "success", title: "All local data cleared" });
      }
      setConfirmAction(null);
      setPendingMode(null);
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "That didn't work", description: "Nothing was changed." });
    }
  }

  return (
    <SettingsSection
      title="Data management"
      description="Your journal is local. Move it, back it up or clear it at any time."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Active data source</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setPendingMode("demo");
                setConfirmAction("mode");
              }}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                mode === "demo"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-elevated/40 hover:bg-elevated",
              )}
            >
              <Sparkles className={cn("mt-0.5 size-4", mode === "demo" ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-foreground">Sample data</span>
                <span className="mt-1 block text-xs text-muted-foreground">In-memory examples</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingMode("live");
                setConfirmAction("mode");
              }}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                mode === "live"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-elevated/40 hover:bg-elevated",
              )}
            >
              <Database className={cn("mt-0.5 size-4", mode === "live" ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-foreground">My data</span>
                <span className="mt-1 block text-xs text-muted-foreground">Private IndexedDB journal</span>
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportJSON}>
            <FileJson className="size-4" aria-hidden="true" />
            Export backup
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Import backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("import-samples")}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Import samples
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmAction("reset")}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Clear all data
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label="Choose a KLYRO JSON backup file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />

        <div className="border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={reopenOnboarding}>
            Replay introduction
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "mode"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={pendingMode === "demo" ? "Switch to sample data?" : "Switch to your own data?"}
        description="Neither mode deletes the other. Unsaved sample edits reset when you return to samples."
        confirmLabel="Switch"
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirmAction === "import-samples"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Import sample data?"
        description="This replaces the contents of your local journal with samples. Export a backup first if you want to keep it."
        confirmLabel="Import samples"
        variant="danger"
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirmAction === "import-backup"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Restore this backup?"
        description={`This will replace all local data with ${backup?.transactions.length ?? 0} transactions, ${backup?.goals.length ?? 0} goals and ${backup?.categories.length ?? 0} categories. This cannot be undone.`}
        confirmLabel="Restore backup"
        variant="danger"
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirmAction === "reset"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Clear all application data?"
        description="Every transaction, budget, goal, category and setting stored in this browser will be permanently deleted."
        confirmLabel="Delete everything"
        variant="danger"
        onConfirm={handleConfirm}
      />
    </SettingsSection>
  );
}
