"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Moon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_ITEMS, SETTINGS_NAV_ITEM, type NavItem } from "@/constants";
import { useSettingsStore, useUIStore } from "@/stores";
import { cn } from "@/lib/utils";
import { AppearancePicker } from "@/components/settings/appearance-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brand } from "./brand";

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active ? "text-foreground" : "text-muted-foreground hover:bg-elevated/60 hover:text-foreground",
      )}
    >
      {active ? (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg border border-border bg-elevated"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
      <Icon className="relative size-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span className="relative truncate">{item.label}</span> : null}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const displayName = useSettingsStore((state) => state.displayName);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center px-5", collapsed && "justify-center px-0")}>
        <Brand collapsed={collapsed} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border px-3 py-3">
        <NavLink
          item={SETTINGS_NAV_ITEM}
          active={pathname === SETTINGS_NAV_ITEM.href}
          collapsed={collapsed}
        />

        <button
          type="button"
          onClick={() => setAppearanceOpen(true)}
          title="Appearance"
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <Moon className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed ? <span>Appearance</span> : null}
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
          {!collapsed ? <span>Collapse</span> : null}
        </button>

        <Link
          href="/settings"
          title="Your profile"
          className={cn(
            "mt-2 flex items-center gap-3 rounded-xl border border-border bg-elevated/50 p-2.5 transition-colors hover:bg-elevated",
            collapsed && "justify-center p-2",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
            {displayName.slice(0, 1).toUpperCase() || "K"}
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-foreground">{displayName}</span>
              <span className="block truncate text-[11px] text-muted-foreground">Personal account</span>
            </span>
          ) : null}
        </Link>
      </div>

      <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appearance</DialogTitle>
            <DialogDescription>KLYRO is dark by design. Choose how deep you want it.</DialogDescription>
          </DialogHeader>
          <AppearancePicker compact />
        </DialogContent>
      </Dialog>
    </aside>
  );
}
