import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import * as service from "../services/memories.service";

const SCOPE = "Memórias";

export function useMemories() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.memories.list(homeId),
    enabled: !!homeId,
    staleTime: STALE.medium,
    queryFn: () => service.listMemories(homeId!),
  });
}

export function useMemoryMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.memories.all });

  const create = useMutation({
    mutationFn: async (input: { title: string; content: string }) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createMemory(homeId, userId, input);
    },
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e, "Erro ao salvar memória."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteMemory(id),
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e),
  });

  return { create, remove };
}
