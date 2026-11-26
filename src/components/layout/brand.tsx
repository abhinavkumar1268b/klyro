import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/constants";

interface BrandProps {
  collapsed?: boolean;
  className?: string;
}

export function Brand({ collapsed = false, className }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-3 rounded-lg", className)}
      aria-label={`${APP_NAME} home`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
        K
      </span>
      {!collapsed ? (
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold tracking-[0.14em] text-foreground">
            {APP_NAME}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">{APP_TAGLINE}</span>
        </span>
      ) : null}
    </Link>
  );
}
