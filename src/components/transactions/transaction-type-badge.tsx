import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TransactionType } from "@/types";

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const income = type === "income";
  const Icon = income ? ArrowDownLeft : ArrowUpRight;

  return (
    <Badge variant={income ? "default" : "secondary"} className="gap-1">
      <Icon className="size-3" aria-hidden="true" />
      {income ? "Income" : "Expense"}
    </Badge>
  );
}
