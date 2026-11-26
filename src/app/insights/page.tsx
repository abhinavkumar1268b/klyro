import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { InsightsView } from "@/components/insights";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Understand"
        title="Insights"
        description="The patterns behind your money, without the noise."
      />
      <InsightsView />
    </div>
  );
}
