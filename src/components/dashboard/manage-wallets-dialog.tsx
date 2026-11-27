"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Power } from "lucide-react";
import {
  WALLET_DEFINITIONS,
  WALLET_ICONS,
  paymentMethodForWallet,
  type WalletKind,
} from "@/constants/wallets";
import { saveWalletSettings } from "@/features/wallet";
import { useCurrentDate } from "@/hooks";
import { formatCurrency } from "@/lib/calculations";
import { notify } from "@/stores/toast-store";
import type { Wallet } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface Draft {
  id: string;
  name: string;
  kind: WalletKind;
  icon: string;
  openingBalance: string;
  enabled: boolean;
  isNew: boolean;
  createdAt?: string;
  sortOrder: number;
}

function toDraft(wallet: Wallet): Draft {
  return {
    id: wallet.id,
    name: wallet.name,
    kind: wallet.kind,
    icon: wallet.icon,
    openingBalance: String(wallet.openingBalance / 100),
    enabled: wallet.enabled,
    isNew: false,
    createdAt: wallet.createdAt,
    sortOrder: wallet.sortOrder,
  };
}

export function ManageWalletsDialog({
  open,
  onOpenChange,
  wallets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
}) {
  const currentDate = useCurrentDate();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const nextWalletNumber = useRef(1);

  const sorted = [...wallets].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = sorted.filter((wallet) => wallet.enabled).length;
  const missingKinds = WALLET_DEFINITIONS.filter(
    (definition) => !wallets.some((wallet) => wallet.kind === definition.kind),
  );

  function close() {
    setDraft(null);
    setError("");
    onOpenChange(false);
  }

  function startEdit(wallet: Wallet) {
    setError("");
    setDraft(toDraft(wallet));
  }

  function startAdd(kind: WalletKind) {
    const definition = WALLET_DEFINITIONS.find((item) => item.kind === kind);
    setError("");
    setDraft({
      id: `${kind}-custom-${nextWalletNumber.current++}`,
      name: kind === "other" ? "New Wallet" : (definition?.name ?? kind),
      kind,
      icon: definition?.icon ?? "Wallet",
      openingBalance: "0",
      enabled: true,
      isNew: true,
      sortOrder: wallets.length,
    });
  }

  async function saveDraft() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setError("Enter a wallet name.");
      return;
    }
    const value = Number(draft.openingBalance);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid opening balance.");
      return;
    }
    const stamp = new Date().toISOString();
    const existing = wallets.find((wallet) => wallet.id === draft.id);
    const wallet: Wallet = {
      id: draft.id,
      name,
      kind: draft.kind,
      icon: draft.icon,
      paymentMethod: existing?.paymentMethod ?? paymentMethodForWallet(draft.kind),
      sortOrder: existing?.sortOrder ?? draft.sortOrder,
      enabled: draft.enabled,
      openingBalance: Math.round(value * 100),
      startDate: existing?.startDate ?? currentDate?.dateKey ?? stamp.slice(0, 10),
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    try {
      await saveWalletSettings(wallet);
      notify({ variant: "success", title: draft.isNew ? "Wallet added" : "Wallet updated" });
      close();
    } catch {
      notify({ variant: "error", title: "Could not save wallet" });
    }
  }

  async function toggle(wallet: Wallet) {
    try {
      await saveWalletSettings({ ...wallet, enabled: !wallet.enabled });
    } catch {
      notify({ variant: "error", title: "Could not update wallet" });
    }
  }

  async function move(wallet: Wallet, direction: -1 | 1) {
    const target = sorted.find((item) => item.sortOrder === wallet.sortOrder + direction);
    if (!target) return;
    try {
      await saveWalletSettings({ ...wallet, sortOrder: target.sortOrder });
      await saveWalletSettings({ ...target, sortOrder: wallet.sortOrder });
    } catch {
      notify({ variant: "error", title: "Could not reorder wallets" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>Manage Wallets</span>
            <Button size="sm" variant="outline" onClick={() => startAdd("other")}>
              <Plus className="size-4" aria-hidden="true" />
              Add Wallet
            </Button>
          </DialogTitle>
          <DialogDescription>
            {activeCount} active {activeCount === 1 ? "wallet" : "wallets"}. Disabled wallets keep
            their money and history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Active wallets
            </p>
            <div className="space-y-2">
              {sorted.map((wallet, index) => (
                <div
                  key={wallet.id}
                  className="rounded-xl border border-border bg-elevated/40 p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
                      <CategoryIcon name={wallet.icon} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-medium text-foreground">
                          {wallet.name}
                        </p>
                        <Badge variant={wallet.enabled ? "default" : "secondary"} className="text-[10px]">
                          {wallet.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatCurrency(wallet.openingBalance)} opening · {wallet.kind}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-1.5 border-t border-border pt-3">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(wallet)} aria-label={`Edit ${wallet.name}`}>
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(wallet)} aria-label={`${wallet.enabled ? "Disable" : "Enable"} ${wallet.name}`}>
                      <Power className="size-4" aria-hidden="true" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => move(wallet, -1)} aria-label={`Move ${wallet.name} up`}>
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={index === sorted.length - 1} onClick={() => move(wallet, 1)} aria-label={`Move ${wallet.name} down`}>
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {missingKinds.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Available wallet types
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {missingKinds.map((definition) => (
                  <button
                    key={definition.id}
                    type="button"
                    onClick={() => startAdd(definition.kind)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-elevated/40 p-3 text-left transition-colors hover:bg-elevated"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                      <CategoryIcon name={definition.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-medium text-foreground">
                        {definition.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {definition.description}
                      </span>
                    </span>
                    <Plus className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground">
                {draft.isNew ? "Add wallet" : `Edit ${draft.name}`}
              </p>
              <div className="space-y-2">
                <Label htmlFor="wallet-name">Wallet name</Label>
                <Input
                  id="wallet-name"
                  value={draft.name}
                  maxLength={40}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wallet-kind">Type</Label>
                  <Select
                    id="wallet-kind"
                    value={draft.kind}
                    onChange={(event) => {
                      const kind = event.target.value as WalletKind;
                      const definition = WALLET_DEFINITIONS.find((item) => item.kind === kind);
                      setDraft({
                        ...draft,
                        kind,
                        icon: definition?.icon ?? draft.icon,
                      });
                    }}
                  >
                    {WALLET_DEFINITIONS.map((definition) => (
                      <option key={definition.kind} value={definition.kind}>
                        {definition.name}
                      </option>
                    ))}
                    <option value="other">Custom</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet-icon">Icon</Label>
                  <Select
                    id="wallet-icon"
                    value={draft.icon}
                    onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
                  >
                    {WALLET_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-opening">Opening balance</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    id="wallet-opening"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-8"
                    value={draft.openingBalance}
                    onChange={(event) => setDraft({ ...draft, openingBalance: event.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-current text-primary"
                  checked={draft.enabled}
                  onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
                />
                Wallet enabled
              </label>
              {error ? <p className="text-xs text-danger">{error}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={saveDraft}>Save wallet</Button>
                <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
