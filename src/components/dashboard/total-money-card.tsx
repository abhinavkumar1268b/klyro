"use client";

import { useState } from "react";
import { ArrowLeftRight, Pencil, Plus, Minus, Power } from "lucide-react";
import { recordWalletAdjustment, recordWalletTransfer, saveWalletSettings } from "@/features/wallet";
import { useCurrentDate } from "@/hooks";
import { formatCurrency, type WalletSummary } from "@/lib/calculations";
import { notify } from "@/stores/toast-store";
import type { Wallet } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type WalletDialog = "balance" | "adjust" | "transfer" | null;

export function TotalMoneyCard({
  summaries,
  total,
}: {
  summaries: WalletSummary[];
  total: number;
}) {
  const currentDate = useCurrentDate();
  const [dialog, setDialog] = useState<WalletDialog>(null);
  const [targetWallet, setTargetWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [error, setError] = useState("");

  const active = summaries.filter((item) => item.wallet.enabled);

  function open(kind: WalletDialog, wallet?: Wallet) {
    setError("");
    setAmount("");
    setNote("");
    setTargetWallet(wallet ?? null);
    if (kind === "transfer") {
      setFromId(active[0]?.wallet.id ?? "");
      setToId(active[1]?.wallet.id ?? active[0]?.wallet.id ?? "");
    }
    setDialog(kind);
  }

  function close() {
    setDialog(null);
    setTargetWallet(null);
    setError("");
  }

  async function saveBalance() {
    if (!targetWallet) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid starting balance.");
      return;
    }
    try {
      await saveWalletSettings({
        ...targetWallet,
        openingBalance: Math.round(value * 100),
        startDate: currentDate?.dateKey ?? targetWallet.startDate,
      });
      notify({ variant: "success", title: `${targetWallet.name} balance updated` });
      close();
    } catch {
      notify({ variant: "error", title: "Could not update wallet" });
    }
  }

  async function saveAdjustment() {
    if (!targetWallet) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    try {
      await recordWalletAdjustment({
        walletId: targetWallet.id,
        amount: Math.round(value * 100) * (adjustMode === "add" ? 1 : -1),
        date: currentDate?.dateKey ?? targetWallet.startDate,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      notify({ variant: "success", title: `${targetWallet.name} updated` });
      close();
    } catch {
      notify({ variant: "error", title: "Could not update wallet" });
    }
  }

  async function saveTransfer() {
    const value = Number(amount);
    const source = summaries.find((item) => item.wallet.id === fromId);
    if (!source || fromId === toId) {
      setError("Choose two different wallets.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    const minor = Math.round(value * 100);
    if (minor > source.balance) {
      setError(`${source.wallet.name} only has ${formatCurrency(source.balance)} available.`);
      return;
    }
    try {
      await recordWalletTransfer({
        fromWalletId: fromId,
        toWalletId: toId,
        amount: minor,
        date: currentDate?.dateKey ?? source.wallet.startDate,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      notify({ variant: "success", title: "Transfer saved", description: "Your total money did not change." });
      close();
    } catch {
      notify({ variant: "error", title: "Could not save transfer" });
    }
  }

  async function toggleWallet(wallet: Wallet) {
    try {
      await saveWalletSettings({ ...wallet, enabled: !wallet.enabled });
    } catch {
      notify({ variant: "error", title: "Could not update wallet" });
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            My total money
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Combined balance across your active wallets
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => open("transfer")}>
          <ArrowLeftRight className="size-4" aria-hidden="true" />
          Transfer
        </Button>
      </div>

      <p className="mt-5 text-[44px] font-semibold leading-none tracking-[-0.03em] text-foreground tabular-nums sm:text-[56px]">
        {formatCurrency(total)}
      </p>

      <div className="mt-6 space-y-2 border-t border-border pt-5">
        {summaries.map((item) => (
          <div
            key={item.wallet.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-elevated/40 px-3.5 py-3",
              !item.wallet.enabled && "opacity-60",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <CategoryIcon name={item.wallet.icon} className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{item.wallet.name}</p>
                {!item.wallet.enabled ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Off
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.wallet.enabled ? "Active wallet" : "Excluded from total"}
              </p>
            </div>
            <p className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(item.balance)}
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => open("balance", item.wallet)}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
                aria-label={`Set ${item.wallet.name} balance`}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustMode("add");
                  open("adjust", item.wallet);
                }}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                aria-label={`Add money to ${item.wallet.name}`}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustMode("remove");
                  open("adjust", item.wallet);
                }}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                aria-label={`Remove money from ${item.wallet.name}`}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => toggleWallet(item.wallet)}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
                aria-label={`${item.wallet.enabled ? "Disable" : "Enable"} ${item.wallet.name}`}
              >
                <Power className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialog === "balance"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set {targetWallet?.name} balance</DialogTitle>
            <DialogDescription>
              This is the money already in this wallet. Past transactions are never changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="wallet-balance">Current balance</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                id="wallet-balance"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="pl-8"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={saveBalance}>Save balance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "adjust"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adjustMode === "add" ? "Add money to" : "Remove money from"} {targetWallet?.name}
            </DialogTitle>
            <DialogDescription>A manual wallet adjustment, not income or an expense.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-adjustment">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  id="wallet-adjustment"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-8"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment-note">Note (optional)</Label>
              <Input
                id="adjustment-note"
                value={note}
                maxLength={80}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Found cash"
              />
            </div>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={saveAdjustment}>Save adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "transfer"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer money</DialogTitle>
            <DialogDescription>
              Moving money between wallets does not change your total money.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transfer-from">From</Label>
                <Select id="transfer-from" value={fromId} onChange={(event) => setFromId(event.target.value)}>
                  {active.map((item) => (
                    <option key={item.wallet.id} value={item.wallet.id}>
                      {item.wallet.name} · {formatCurrency(item.balance)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-to">To</Label>
                <Select id="transfer-to" value={toId} onChange={(event) => setToId(event.target.value)}>
                  {active.map((item) => (
                    <option key={item.wallet.id} value={item.wallet.id}>
                      {item.wallet.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  id="transfer-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-8"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-note">Note (optional)</Label>
              <Input
                id="transfer-note"
                value={note}
                maxLength={80}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={saveTransfer}>Transfer money</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
