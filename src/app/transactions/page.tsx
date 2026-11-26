import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { TransactionHistory } from "@/components/transactions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Transactions" };

interface TransactionsPageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const { from, to } = await searchParams;
  const initialRange = from && to ? { from, to } : undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Journal"
        title="Transactions"
        description={
          initialRange
            ? "Detailed history for the selected period. Filters are ready to refine it further."
            : "Every entry, filterable and exportable. Your complete money trail."
        }
        actions={
          <Button asChild size="sm">
            <Link href="/add">
              <Plus className="size-4" aria-hidden="true" />
              Add entry
            </Link>
          </Button>
        }
      />
      <TransactionHistory initialRange={initialRange} />
    </div>
  );
}
