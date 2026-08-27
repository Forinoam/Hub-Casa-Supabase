/**
 * Orçamento mensal por categoria — regras puras, sem React.
 */
import type { Budget, Expense } from "@/shared/types";
import { ExpenseModel } from "./expense.model";

export type BudgetStatusLevel = "ok" | "warn" | "over";

export type BudgetStatus = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
  level: BudgetStatusLevel;
};

/** A partir de quanto do limite o orçamento vira alerta amarelo. */
export const BUDGET_WARN_RATIO = 0.8;

function inMonth(date: string | null | undefined, ref: Date): boolean {
  if (!date) return false;
  const d = new Date(`${date.slice(0, 10)}T00:00:00`);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function levelFor(percent: number): BudgetStatusLevel {
  if (percent >= 100) return "over";
  if (percent >= BUDGET_WARN_RATIO * 100) return "warn";
  return "ok";
}

/** Quanto já foi lançado (contas + gastos) em cada categoria no mês. */
export function spentByCategory(expenses: Expense[], now: Date = new Date()): Record<string, number> {
  return expenses
    .filter((e) => inMonth(e.due_date, now))
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + ExpenseModel.amount(e);
      return acc;
    }, {});
}

/** Cruza os orçamentos com os lançamentos do mês, do mais estourado ao mais folgado. */
export function buildBudgetStatuses(
  budgets: Budget[],
  expenses: Expense[],
  now: Date = new Date(),
): BudgetStatus[] {
  const spentMap = spentByCategory(expenses, now);
  return budgets
    .map((b) => {
      const limit = Number(b.amount ?? 0);
      const spent = spentMap[b.category] ?? 0;
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        id: b.id,
        category: b.category,
        limit,
        spent,
        remaining: limit - spent,
        percent,
        level: levelFor(percent),
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

export type BudgetTotals = { limit: number; spent: number; percent: number; level: BudgetStatusLevel };

export function budgetTotals(statuses: BudgetStatus[]): BudgetTotals {
  const limit = statuses.reduce((s, b) => s + b.limit, 0);
  const spent = statuses.reduce((s, b) => s + b.spent, 0);
  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  return { limit, spent, percent, level: levelFor(percent) };
}
