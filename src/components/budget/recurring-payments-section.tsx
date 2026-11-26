import { CalendarClock, CircleCheck, Pencil, Plus, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { daysUntilDue, formatCurrency, formatDate, isReminderActive } from "@/lib/calculations";
import type { RecurringPayment } from "@/types";

interface RecurringPaymentsSectionProps {
  payments: RecurringPayment[];
  nameFor: (id: string) => string;
  onAdd: () => void;
  onEdit: (id: number) => void;
  onMark: (id: number) => void;
  onDelete: (id: number) => void;
}

export function RecurringPaymentsSection({
  payments,
  nameFor,
  onAdd,
  onEdit,
  onMark,
  onDelete,
}: RecurringPaymentsSectionProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Recurring payments</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Reminders only — nothing is recorded automatically unless you explicitly opt in.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-elevated/40 px-3 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add reminder
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No recurring payment reminders yet.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {payments.map((payment) => {
            const days = daysUntilDue(payment);
            return (
              <div key={payment.id} className="flex items-center gap-3 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground">
                  <CalendarClock className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{payment.name}</p>
                    {isReminderActive(payment) ? (
                      <Badge variant="default" className="text-[10px]">
                        Due soon
                      </Badge>
                    ) : null}
                    {payment.autoRecord ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Auto-record on
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {payment.frequency} · next {formatDate(payment.nextDueDate)} ·{" "}
                    {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} away`} ·{" "}
                    {nameFor(payment.categoryId)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(payment.amount)}
                </p>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onMark(payment.id!)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label={`Mark ${payment.name} as paid`}
                    title="Mark as paid"
                  >
                    <CircleCheck className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(payment.id!)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
                    aria-label={`Edit ${payment.name} reminder`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(payment.id!)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label={`Delete ${payment.name} reminder`}
                  >
                    <Trash className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
