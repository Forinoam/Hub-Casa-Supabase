import type { Handler } from "../bus";
import { qk } from "@/shared/utils/query-keys";
import { nextOccurrenceDate } from "@/shared/utils/recurrence";

/**
 * Financeiro recorrente: ao marcar uma CONTA recorrente como paga, a próxima
 * conta é criada automaticamente com o vencimento deslocado. Gastos avulsos
 * e contas únicas não geram nada.
 */
export const handleExpenseRecurring: Handler<"expense.paid"> = async (event, { queryClient }) => {
  const nextDue = nextOccurrenceDate(event.recurrence, event.dueDate);
  if (!nextDue) return;

  const { createExpense } = await import("@/modules/finance/services/finance.service");
  const { getCurrentUserId } = await import("@/shared/services/auth.service");
  const userId = await getCurrentUserId();

  await createExpense(event.homeId, userId, {
    description: event.description,
    // Contas variáveis (valor desconhecido) continuam sem valor no próximo mês.
    amount: event.amount ?? null,
    category: event.category,
    due_date: nextDue,
    recurrence: event.recurrence,
    kind: "bill",
  });

  queryClient.invalidateQueries({ queryKey: qk.finance.all });
  queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
};
