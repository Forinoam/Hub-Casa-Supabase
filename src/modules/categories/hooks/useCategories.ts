import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import * as service from "../services/categories.service";

const SCOPE = "Categorias";

export function useCategories() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.categories.list(homeId),
    enabled: !!homeId,
    staleTime: STALE.long,
    queryFn: () => service.listCategories(homeId!),
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.categories.all });

  const create = useMutation({
    mutationFn: async (input: service.CreateCategoryInput) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createCategory(homeId, userId, input);
    },
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e, "Erro ao criar categoria."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteCategory(id),
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e),
  });

  return { create, remove };
}
