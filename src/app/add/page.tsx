import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { AddEntryView } from "@/components/transactions";

export const metadata: Metadata = { title: "Add entry" };

export default function AddPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Journal"
        title="Add an entry"
        description="Amount first. The details can wait."
      />
      <AddEntryView />
    </div>
  );
}
