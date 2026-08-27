import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import { emit } from "@/automation/bus";
import type { Expense } from "@/shared/types";
import * as service from "../services/finance.service";

const SCOPE = "Financeiro";

export function useExpenses() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.finance.expenses(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listExpenses(homeId!),
  });
}

export function useIncomes() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.finance.incomes(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listIncomes(homeId!),
  });
}

const invalidateFinance = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: qk.finance.all });
  qc.invalidateQueries({ queryKey: qk.dashboard.all });
};

export function useExpenseMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;

  const create = useMutation({
    mutationFn: async (input: service.CreateExpenseInput) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createExpense(homeId, userId, input);
    },
    onSuccess: (created) => {
      invalidateFinance(qc);
      if (homeId && created) {
        emit({
          type: "expense.created",
          homeId,
          expenseId: created.id,
          description: created.description,
          amount: created.amount === null ? null : Number(created.amount),
          category: created.category,
        });
      }
    },
    onError: (e) => reportError(SCOPE, e, "Erro ao salvar despesa."),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: service.UpdateExpenseInput }) =>
      service.updateExpense(id, patch),
    onSuccess: () => invalidateFinance(qc),
    onError: (e) => reportError(SCOPE, e, "Erro ao atualizar lançamento."),
  });

  const togglePaid = useMutation({
    mutationFn: async (
      item: Pick<Expense, "id" | "paid" | "description" | "amount" | "category" | "recurrence" | "due_date">,
    ) => {
      await service.toggleExpensePaid(item);
      return item;
    },
    onSuccess: (item) => {
      invalidateFinance(qc);
      if (homeId && !item.paid) {
        emit({
          type: "expense.paid",
          homeId,
          expenseId: item.id,
          description: item.description,
          amount: item.amount === null ? null : Number(item.amount),
          category: item.category,
          recurrence: item.recurrence,
          dueDate: item.due_date,
        });
      }
    },
    onError: (e) => reportError(SCOPE, e),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteExpense(id),
    onSuccess: () => invalidateFinance(qc),
    onError: (e) => reportError(SCOPE, e),
  });

  return { create, update, togglePaid, remove };
}


export function useIncomeMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;

  const create = useMutation({
    mutationFn: async (input: service.CreateIncomeInput) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createIncome(homeId, userId, input);
    },
    onSuccess: () => invalidateFinance(qc),
    onError: (e) => reportError(SCOPE, e, "Erro ao salvar receita."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteIncome(id),
    onSuccess: () => invalidateFinance(qc),
    onError: (e) => reportError(SCOPE, e),
  });

  return { create, remove };
}
