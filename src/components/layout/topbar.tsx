"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, Sparkles, WifiOff } from "lucide-react";
import { NAV_ITEMS, SETTINGS_NAV_ITEM } from "@/constants";
import { useDataStore, useFilterStore, useSettingsStore, useUIStore } from "@/stores";
import { useCurrentDate, useOnlineStatus } from "@/hooks";
import { parseLocalDateKey } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { DataModeDialog } from "./data-mode-dialog";
import { NotificationsDialog } from "./notifications-dialog";

export function Topbar() {
  const pathname = usePathname();
  const currentDate = useCurrentDate();
  const online = useOnlineStatus();
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen);
  const search = useFilterStore((state) => state.search);
  const setSearch = useFilterStore((state) => state.setSearch);
  const mode = useDataStore((state) => state.mode);
  const displayName = useSettingsStore((state) => state.displayName);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dataModeOpen, setDataModeOpen] = useState(false);

  const current = [...NAV_ITEMS, SETTINGS_NAV_ITEM].find((item) => item.href === pathname);
  const title = current?.label ?? (pathname === "/add" ? "Add entry" : "KLYRO");
  const dateLabel = currentDate
    ? new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parseLocalDateKey(currentDate.dateKey))
    : "";
  const isTransactions = pathname === "/transactions";
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-medium text-foreground">{title}</h1>
        <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{dateLabel}</p>
      </div>

      {isTransactions ? (
        <div className="relative ml-auto hidden w-48 md:block xl:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search transactions"
            aria-label="Search transactions"
            className="h-9 pl-9"
          />
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {!online ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 text-[11px] font-medium text-muted-foreground">
            <WifiOff className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Offline — local data</span>
            <span className="sm:hidden">Offline</span>
          </span>
        ) : null}

        {mode === "demo" ? (
          <button
            type="button"
            onClick={() => setDataModeOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sample data</span>
            <span className="sm:hidden">Demo</span>
          </button>
        ) : null}

        {!isHome ? (
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="hidden size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground sm:flex"
            aria-label="Notifications"
          >
            <Bell className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        {!isHome ? (
          <Link
            href="/settings"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium text-primary transition-colors hover:border-primary/40"
            aria-label="Open settings"
          >
            {displayName.slice(0, 1).toUpperCase() || "K"}
          </Link>
        ) : null}
      </div>

      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <DataModeDialog open={dataModeOpen} onOpenChange={setDataModeOpen} />
    </header>
  );
}
