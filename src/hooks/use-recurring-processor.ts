"use client";

import { useEffect } from "react";
import { processAutoRecurringPayments, recordRecurringPayment } from "@/features/recurring";
import { localDateKey } from "@/lib/date";
import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";

/** Records only payments the user explicitly configured with autoRecord enabled. */
export function useRecurringProcessor(): void {
  const mode = useDataStore((state) => state.mode);

  useEffect(() => {
    if (mode === "live") {
      void processAutoRecurringPayments().catch((error) =>
        console.error("KLYRO could not process recurring payments", error),
      );
      return;
    }

    const today = localDateKey();
    const due = useDemoStore
      .getState()
      .recurringPayments.filter((payment) => payment.autoRecord && payment.nextDueDate <= today);
    for (const payment of due) {
      void recordRecurringPayment(payment.id!).catch((error) =>
        console.error("KLYRO could not process a recurring payment", error),
      );
    }
  }, [mode]);
}
