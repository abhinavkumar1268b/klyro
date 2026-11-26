import { toMinorUnits, todayISO } from "@/lib/calculations";
import { db } from "@/lib/db";
import type { GoalFormValues } from "@/lib/validation";
import type { Goal } from "@/types";

export function listGoals(): Promise<Goal[]> {
  return db.goals.orderBy("createdAt").reverse().toArray();
}

function contributionId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function addGoal(values: GoalFormValues): Promise<number> {
  const now = new Date().toISOString();
  const savedAmount = toMinorUnits(values.savedAmount ?? 0);
  const key = await db.goals.add({
    name: values.name.trim(),
    targetAmount: toMinorUnits(values.targetAmount),
    savedAmount,
    deadline: values.deadline || undefined,
    icon: values.icon,
    tint: values.tint,
    contributions:
      savedAmount > 0
        ? [
            {
              id: contributionId(),
              amount: savedAmount,
              date: todayISO(),
              note: "Opening balance",
              createdAt: now,
            },
          ]
        : [],
    createdAt: now,
    updatedAt: now,
  });
  return key!;
}

export async function updateGoal(id: number, values: GoalFormValues): Promise<void> {
  const existing = await db.goals.get(id);
  if (!existing) throw new Error("Goal not found");

  const savedAmount = toMinorUnits(values.savedAmount ?? 0);
  const delta = savedAmount - existing.savedAmount;
  const now = new Date().toISOString();
  const contributions = [...existing.contributions];
  if (delta !== 0) {
    contributions.push({
      id: contributionId(),
      amount: delta,
      date: todayISO(),
      note: "Balance adjustment",
      createdAt: now,
    });
  }

  await db.goals.update(id, {
    name: values.name.trim(),
    targetAmount: toMinorUnits(values.targetAmount),
    savedAmount,
    deadline: values.deadline || undefined,
    icon: values.icon,
    tint: values.tint,
    contributions,
    updatedAt: now,
    completedAt: savedAmount >= toMinorUnits(values.targetAmount) ? existing.completedAt ?? now : undefined,
  });
}

/** Contributions are stored only on the goal — never as expenses or income. */
export async function contributeToGoal(
  id: number,
  amount: number,
  note?: string,
): Promise<void> {
  await db.goals.where("id").equals(id).modify((goal) => {
    const now = new Date().toISOString();
    goal.savedAmount = Math.max(0, goal.savedAmount + amount);
    goal.contributions = [
      ...(goal.contributions ?? []),
      { id: contributionId(), amount, date: todayISO(), note, createdAt: now },
    ];
    goal.updatedAt = now;
    goal.completedAt =
      goal.savedAmount >= goal.targetAmount ? goal.completedAt ?? now : undefined;
  });
}

export function deleteGoal(id: number): Promise<void> {
  return db.goals.delete(id);
}
