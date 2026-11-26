import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { GoalsView } from "@/components/goals";

export const metadata: Metadata = { title: "Savings Goals" };

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Save"
        title="Savings Goals"
        description="Give every rupee a destination and watch the progress add up."
      />
      <GoalsView />
    </div>
  );
}
