import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { BudgetView } from "@/components/budget";

export const metadata: Metadata = { title: "Budget" };

export default function BudgetPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plan"
        title="Budget"
        description="Set monthly limits and see exactly how much room you have left."
      />
      <BudgetView />
    </div>
  );
}
