import type { Task, ShoppingItem, Expense, MaintenanceItem, Budget, Event as CalendarEvent } from "@/shared/types";
import { buildOverdueTasksInsight } from "./overdueTasks";
import { buildMaintenanceDueInsight } from "./maintenanceDue";
import { buildShoppingSuggestionInsights } from "./shoppingSuggestions";
import { buildFinancialAlertInsights } from "./financialAlerts";
import { buildBudgetAlertInsights } from "./budgetAlerts";
import type { Insight } from "./types";

export * from "./types";

/**
 * Agrega todos os insights isolados em uma única lista ordenada por
 * severidade decrescente. Cada gerador é puro — recebe dados prontos do
 * cache do React Query e devolve `Insight | Insight[] | null`.
 */
export function buildInsights(input: {
  tasks: Task[];
  shopping: ShoppingItem[];
  expenses: Expense[];
  maintenance: MaintenanceItem[];
  events: CalendarEvent[];
  balance: number;
  budgets?: Budget[];
}): Insight[] {
  const insights: Insight[] = [
    ...(buildOverdueTasksInsight(input.tasks) ? [buildOverdueTasksInsight(input.tasks)!] : []),
    ...(buildMaintenanceDueInsight(input.maintenance) ? [buildMaintenanceDueInsight(input.maintenance)!] : []),
    ...buildShoppingSuggestionInsights({ events: input.events }),
    ...buildFinancialAlertInsights({ expenses: input.expenses, balance: input.balance }),
    ...buildBudgetAlertInsights({ budgets: input.budgets ?? [], expenses: input.expenses }),
  ];
  return insights.sort((a, b) => b.severity - a.severity);
}
