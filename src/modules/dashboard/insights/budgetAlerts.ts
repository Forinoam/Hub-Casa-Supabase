import type { Budget, Expense } from "@/shared/types";
import { buildBudgetStatuses } from "@/modules/finance/models/budget.model";
import { formatCurrency } from "@/shared/utils/format";
import type { Insight } from "./types";

/** Categorias estouradas (severidade 3) ou perto do limite (severidade 2). */
export function buildBudgetAlertInsights(input: {
  budgets: Budget[];
  expenses: Expense[];
  now?: Date;
}): Insight[] {
  return buildBudgetStatuses(input.budgets, input.expenses, input.now ?? new Date())
    .filter((b) => b.level !== "ok")
    .map((b) => ({
      id: `insight-budget-${b.id}`,
      kind: "budgetAlert" as const,
      severity: b.level === "over" ? (3 as const) : (2 as const),
      title:
        b.level === "over"
          ? `Orçamento de ${b.category} estourado`
          : `Orçamento de ${b.category} em ${b.percent}%`,
      description: `${formatCurrency(b.spent)} de ${formatCurrency(b.limit)} no mês`,
      route: "/financeiro" as const,
    }));
}
