"use client";

import { Database, Sparkles } from "lucide-react";
import { useDataStore, useDemoStore } from "@/stores";
import { notify } from "@/stores/toast-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DataModeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mode = useDataStore((state) => state.mode);
  const setMode = useDataStore((state) => state.setMode);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const demo = mode === "demo";

  function switchMode() {
    if (demo) {
      setMode("live");
      notify({
        variant: "success",
        title: "Switched to your own data",
        description: "Your private journal is stored on this device.",
      });
    } else {
      resetDemo();
      setMode("demo");
      notify({
        variant: "info",
        title: "Sample data restored",
        description: "Your own journal is untouched and will be here when you return.",
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{demo ? "Exploring sample data" : "Using your own data"}</DialogTitle>
          <DialogDescription>
            {demo
              ? "These numbers are realistic examples held in memory. Nothing here is saved to your device's journal."
              : "Everything you add is stored privately in this browser. No account, no server."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-elevated/40 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {demo ? <Sparkles className="size-4" aria-hidden="true" /> : <Database className="size-4" aria-hidden="true" />}
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {demo
              ? "Switching keeps your real data exactly as it is. You can come back to samples any time."
              : "Switching to samples won't delete anything — it just shows the in-memory demo journal."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep exploring
          </Button>
          <Button onClick={switchMode}>
            {demo ? "Use my own data" : "Explore samples"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
