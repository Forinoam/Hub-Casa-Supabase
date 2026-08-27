import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import * as service from "../services/budgets.service";

const SCOPE = "Orçamentos";

export function useBudgets() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.finance.budgets(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listBudgets(homeId!),
  });
}

export function useBudgetMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.finance.all });
    qc.invalidateQueries({ queryKey: qk.dashboard.all });
  };

  const upsert = useMutation({
    mutationFn: async (input: service.UpsertBudgetInput) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.upsertBudget(homeId!, userId!, input);
    },
    onSuccess: invalidate,
    onError: (e) => reportError(SCOPE, e, "Erro ao salvar orçamento."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteBudget(id),
    onSuccess: invalidate,
    onError: (e) => reportError(SCOPE, e),
  });

  return { upsert, remove };
}
