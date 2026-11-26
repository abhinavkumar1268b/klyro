"use client";

import { useState } from "react";
import { addToGoal } from "@/features/goals";
import { formatCurrency, toMinorUnits } from "@/lib/calculations";
import { notify } from "@/stores/toast-store";
import type { Goal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QUICK_AMOUNTS = [500, 1000, 2500];

export function ContributeDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!goal) return;
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      notify({ variant: "error", title: "Enter an amount", description: "It must be greater than zero." });
      return;
    }
    setBusy(true);
    try {
      await addToGoal(goal.id!, toMinorUnits(numeric), note.trim() || undefined);
      notify({ variant: "success", title: "Contribution added", description: `${goal.name} · ${formatCurrency(toMinorUnits(numeric))}` });
      setAmount("");
      setNote("");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Could not save contribution", description: "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAmount("");
          setNote("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to {goal?.name ?? "goal"}</DialogTitle>
          <DialogDescription>Every contribution moves you closer.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contribution-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="contribution-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="pl-8 text-lg tabular-nums"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className="h-9 rounded-lg border border-border bg-elevated/40 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                + {formatCurrency(toMinorUnits(value))}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contribution-note">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="contribution-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Sold old books"
              maxLength={80}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Add contribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
