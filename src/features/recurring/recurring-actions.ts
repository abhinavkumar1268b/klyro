import { advanceDueDate } from "@/lib/calculations";
import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type { RecurringPaymentFormValues } from "@/lib/validation";
import {
  addRecurringPayment,
  deleteRecurringPayment,
  markRecurringPaid,
  updateRecurringPayment,
} from "./recurring-payment-service";

const isDemo = () => useDataStore.getState().mode === "demo";

export async function saveRecurringPayment(
  values: RecurringPaymentFormValues,
  id?: number,
): Promise<void> {
  if (isDemo()) {
    const demo = useDemoStore.getState();
    if (id !== undefined) demo.updateRecurringPayment(id, values);
    else demo.addRecurringPayment(values);
    return;
  }
  if (id !== undefined) await updateRecurringPayment(id, values);
  else await addRecurringPayment(values);
}

export async function removeRecurringPayment(id: number): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().deleteRecurringPayment(id);
    return;
  }
  await deleteRecurringPayment(id);
}

export async function recordRecurringPayment(id: number): Promise<void> {
  if (isDemo()) {
    const demo = useDemoStore.getState();
    const payment = demo.recurringPayments.find((item) => item.id === id);
    if (!payment) throw new Error("Recurring payment not found");

    demo.addTransaction({
      type: "expense",
      amount: payment.amount / 100,
      categoryId: payment.categoryId,
      title: payment.name,
      description: `Recurring payment · ${payment.name}`,
      date: payment.nextDueDate,
      paymentMethod: "Other",
    });
    demo.updateRecurringPayment(id, {
      name: payment.name,
      amount: payment.amount / 100,
      categoryId: payment.categoryId,
      frequency: payment.frequency,
      nextDueDate: advanceDueDate(payment.nextDueDate, payment.frequency),
      reminderDays: payment.reminderDays,
      autoRecord: payment.autoRecord,
    });
    return;
  }
  await markRecurringPaid(id);
}
