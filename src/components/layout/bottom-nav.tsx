"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BOTTOM_NAV_ITEMS } from "@/constants";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] lg:hidden"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto grid h-[4.5rem] max-w-md grid-cols-5 items-center px-1 sm:px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label="Add transaction"
                aria-current={active ? "page" : undefined}
                className="flex h-full min-w-11 flex-col items-center justify-center gap-0.5"
              >
                <motion.span
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                    active && "ring-2 ring-primary/40 ring-offset-2 ring-offset-card",
                  )}
                >
                  <Icon className="size-5" strokeWidth={2.3} aria-hidden="true" />
                </motion.span>
                <span className="text-[10px] font-semibold text-primary">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex h-full min-w-11 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-[color,transform] hover:text-foreground active:scale-95 motion-reduce:transform-none"
            >
              <Icon className={cn("size-5", active && "text-primary")} aria-hidden="true" />
              <span className={cn("text-[10px] font-medium", active && "text-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
