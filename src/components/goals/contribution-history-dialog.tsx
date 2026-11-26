import { formatCurrency, formatDate } from "@/lib/calculations";
import type { Goal } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ContributionHistoryDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const entries = [...(goal?.contributions ?? [])].reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal?.name ?? "Goal"} contributions</DialogTitle>
          <DialogDescription>
            Saved separately from your expense and income journal.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No contributions recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-elevated/40 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{entry.note || "Contribution"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-primary">
                  +{formatCurrency(entry.amount)}
                </p>
              </div>
            ))}
            <p className="border-t border-border pt-3 text-right text-xs text-muted-foreground">
              Total tracked: {formatCurrency(goal?.savedAmount ?? 0)}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
