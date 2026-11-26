"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { formatCurrency, toMinorUnits } from "@/lib/calculations";
import type { TransactionFormValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./transaction-form";

export function AddEntryView() {
  const router = useRouter();
  const [saved, setSaved] = useState<TransactionFormValues | null>(null);

  return (
    <>
      <TransactionForm showPreview onSaved={setSaved} />

      <Dialog open={saved !== null} onOpenChange={(open) => !open && setSaved(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <CircleCheck className="size-5" aria-hidden="true" />
            </span>
            <DialogTitle>Entry added</DialogTitle>
            <DialogDescription>
              {saved?.title} · {formatCurrency(toMinorUnits(saved?.amount ?? 0))} is now in your journal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaved(null)}>
              Add another
            </Button>
            <Button onClick={() => router.push("/transactions")}>View transactions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
