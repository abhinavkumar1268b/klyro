"use client";

import type * as React from "react";
import { useUIStore } from "@/stores";
import { PageTransition, Toaster } from "@/components/ui";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/** Persistent chrome around every route. Pages only own their content. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div
        className={cn(
          "min-h-dvh transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <Topbar />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <BottomNav />
      <MobileNav />
      <Toaster />
    </div>
  );
}
