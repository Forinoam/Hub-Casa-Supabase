import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import * as service from "../services/cards.service";

const SCOPE = "Cartões";

export function useCards() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.finance.cards(homeId),
    enabled: !!homeId,
    staleTime: STALE.medium,
    queryFn: () => service.listCards(homeId!),
  });
}

export function useCardMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.finance.all });
    qc.invalidateQueries({ queryKey: qk.dashboard.all });
  };

  const create = useMutation({
    mutationFn: async (input: service.CardInput) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createCard(homeId!, userId!, input);
    },
    onSuccess: invalidate,
    onError: (e) => reportError(SCOPE, e, "Erro ao salvar cartão."),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<service.CardInput> }) =>
      service.updateCard(id, patch),
    onSuccess: invalidate,
    onError: (e) => reportError(SCOPE, e),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteCard(id),
    onSuccess: invalidate,
    onError: (e) => reportError(SCOPE, e),
  });

  return { create, update, remove };
}
