import type { Expense } from "@/shared/types";
import { ExpenseModel } from "@/modules/finance/models/expense.model";
import { formatCurrency } from "@/shared/utils/format";
import type { Insight } from "./types";

export function buildFinancialAlertInsights(input: {
  expenses: Expense[];
  balance: number;
}): Insight[] {
  const insights: Insight[] = [];
  const overdue = input.expenses.filter((e) => !e.paid && ExpenseModel.isOverdue(e));
  if (overdue.length > 0) {
    const total = overdue.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    insights.push({
      id: "insight-overdue-bills",
      kind: "financialAlert",
      severity: 3,
      title: `${overdue.length} conta(s) vencida(s)`,
      description: `Total: ${formatCurrency(total)}`,
      route: "/financeiro",
    });
  }
  if (input.balance < 0) {
    insights.push({
      id: "insight-negative-balance",
      kind: "financialAlert",
      severity: 2,
      title: "Saldo do mês negativo",
      description: `Despesas superam receitas em ${formatCurrency(Math.abs(input.balance))}`,
      route: "/financeiro",
    });
  }
  return insights;
}
