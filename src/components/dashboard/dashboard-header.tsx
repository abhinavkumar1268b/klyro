"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { useCurrentDate } from "@/hooks";
import { parseLocalDateKey } from "@/lib/date";
import { useSettingsStore } from "@/stores";
import { NotificationsDialog } from "@/components/layout/notifications-dialog";
import { DashboardGreeting } from "./dashboard-greeting";

export function DashboardHeader() {
  const currentDate = useCurrentDate();
  const displayName = useSettingsStore((state) => state.displayName);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const monthLabel = currentDate
    ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
        parseLocalDateKey(currentDate.dateKey),
      )
    : "";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
          <DashboardGreeting />
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {monthLabel || "This month"} · a clear look at where you stand.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" aria-hidden="true" />
        </button>
        <Link
          href="/settings"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-elevated text-sm font-medium text-primary transition-colors hover:border-primary/40"
          aria-label="Open profile"
        >
          {displayName.slice(0, 1).toUpperCase() || "K"}
        </Link>
      </div>

      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
}
