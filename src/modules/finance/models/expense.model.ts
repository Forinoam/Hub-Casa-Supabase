import type { Expense } from "@/shared/types";
import { todayKey } from "@/shared/utils/format";
import { isRecurring } from "@/shared/utils/recurrence";

/** "bill" = conta/obrigação com vencimento; "spend" = gasto já realizado. */
export type ExpenseKindValue = "bill" | "spend";

export const ExpenseModel = {
  kind(e: Pick<Expense, "kind">): ExpenseKindValue {
    return (e as { kind?: string }).kind === "spend" ? "spend" : "bill";
  },
  isBill(e: Pick<Expense, "kind">): boolean {
    return ExpenseModel.kind(e) === "bill";
  },
  isSpend(e: Pick<Expense, "kind">): boolean {
    return ExpenseModel.kind(e) === "spend";
  },
  isPaid(e: Pick<Expense, "paid">): boolean {
    return !!e.paid;
  },
  isRecurring(e: Pick<Expense, "recurrence">): boolean {
    return isRecurring(e.recurrence);
  },
  /** Conta recorrente sem valor definido ainda (energia, água, cartão…). */
  needsAmount(e: Pick<Expense, "amount" | "kind">): boolean {
    return ExpenseModel.isBill(e) && (e.amount === null || e.amount === undefined);
  },
  amount(e: Pick<Expense, "amount">): number {
    return Number(e.amount ?? 0);
  },
  isOverdue(e: Pick<Expense, "due_date" | "paid" | "kind">): boolean {
    if (!ExpenseModel.isBill(e)) return false;
    if (e.paid || !e.due_date) return false;
    return e.due_date < todayKey();
  },
};
