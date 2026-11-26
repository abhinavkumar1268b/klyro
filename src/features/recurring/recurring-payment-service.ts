import { advanceDueDate } from "@/lib/calculations";
import { localDateKey } from "@/lib/date";
import { db } from "@/lib/db";
import type { RecurringPaymentFormValues } from "@/lib/validation";
import type { RecurringPayment } from "@/types";

export function listRecurringPayments(): Promise<RecurringPayment[]> {
  return db.recurringPayments.orderBy("nextDueDate").toArray();
}

function toRecord(values: RecurringPaymentFormValues, existing?: RecurringPayment) {
  return {
    name: values.name.trim(),
    amount: Math.round(values.amount * 100),
    categoryId: values.categoryId,
    frequency: values.frequency,
    nextDueDate: values.nextDueDate,
    reminderDays: values.reminderDays,
    autoRecord: values.autoRecord,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function addRecurringPayment(values: RecurringPaymentFormValues): Promise<number> {
  const key = await db.recurringPayments.add(toRecord(values));
  return key!;
}

export async function updateRecurringPayment(
  id: number,
  values: RecurringPaymentFormValues,
): Promise<void> {
  const existing = await db.recurringPayments.get(id);
  if (!existing) throw new Error("Recurring payment not found");
  await db.recurringPayments.update(id, toRecord(values, existing));
}

export function deleteRecurringPayment(id: number): Promise<void> {
  return db.recurringPayments.delete(id);
}

/** Records a due payment only when the user explicitly asks (Mark as paid). */
export async function markRecurringPaid(id: number): Promise<void> {
  const payment = await db.recurringPayments.get(id);
  if (!payment) throw new Error("Recurring payment not found");
  const recordedDate = localDateKey();

  await db.transaction("rw", db.transactions, db.recurringPayments, async () => {
    const alreadyRecorded = await db.transactions
      .where("sourceRecurringId")
      .equals(id)
      .toArray();
    if (!alreadyRecorded.some((item) => item.date === payment.nextDueDate)) {
      await db.transactions.add({
        type: "expense",
        amount: payment.amount,
        categoryId: payment.categoryId,
        title: payment.name,
        description: `Recurring payment · ${payment.name}`,
        date: payment.nextDueDate,
        paymentMethod: "Other",
        sourceRecurringId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await db.recurringPayments.update(id, {
      nextDueDate: advanceDueDate(payment.nextDueDate, payment.frequency),
      lastRecordedDate: recordedDate,
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * Only payments with autoRecord explicitly enabled are recorded automatically.
 * The form explains this behaviour before a user can switch it on.
 */
export async function processAutoRecurringPayments(): Promise<number> {
  const today = localDateKey();
  const due = await db.recurringPayments
    .where("nextDueDate")
    .belowOrEqual(today)
    .toArray();
  const auto = due.filter((payment) => payment.autoRecord);
  for (const payment of auto) await markRecurringPaid(payment.id!);
  return auto.length;
}
