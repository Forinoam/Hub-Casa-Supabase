import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import { emit } from "@/automation/bus";
import {
  applyOptimistic,
  patchItem,
  removeItem,
  rollbackOptimistic,
  type OptimisticSnapshot,
} from "@/shared/utils/optimistic";
import type { ShoppingItem } from "@/shared/types";
import * as service from "../services/shopping.service";

const SCOPE = "Compras";

export function useShoppingItems() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.shopping.list(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listShopping(homeId!),
  });
}

export function useUrgentShopping(limit = 3) {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.shopping.urgent(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listUrgentShopping(homeId!, limit),
  });
}

export function useShoppingMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.shopping.all });
    qc.invalidateQueries({ queryKey: qk.dashboard.all });
  };
  const listKeys = () => [qk.shopping.list(homeId)];

  const add = useMutation({
    mutationFn: async (input: { name: string; category: string }) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createShopping(homeId, userId, input);
    },
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e, "Erro ao salvar item."),
  });

  const toggle = useMutation({
    mutationFn: async (item: Pick<ShoppingItem, "id" | "bought" | "name" | "quantity" | "unit">) => {
      const nextBought = !item.bought;
      await service.toggleShopping(item);
      return { item, nextBought };
    },
    onMutate: (item) =>
      applyOptimistic<ShoppingItem[]>(
        qc,
        listKeys(),
        patchItem<ShoppingItem>(item.id, {
          bought: !item.bought,
          bought_at: !item.bought ? new Date().toISOString() : null,
        } as Partial<ShoppingItem>),
      ),
    onSuccess: ({ item, nextBought }) => {
      if (nextBought && homeId) {
        emit({
          type: "shopping.completed",
          homeId,
          itemId: item.id,
          name: item.name,
          quantity: Number(item.quantity ?? 1) || 1,
          unit: item.unit ?? null,
          // `amount` intencionalmente ausente: `shopping_items` não guarda preço.
          amount: null,
        });
      }
    },
    onError: (e, _vars, ctx) => {
      rollbackOptimistic(qc, ctx as OptimisticSnapshot);
      reportError(SCOPE, e);
    },
    onSettled: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteShopping(id),
    onMutate: (id) => applyOptimistic<ShoppingItem[]>(qc, listKeys(), removeItem<ShoppingItem>(id)),
    onError: (e, _vars, ctx) => {
      rollbackOptimistic(qc, ctx as OptimisticSnapshot);
      reportError(SCOPE, e);
    },
    onSettled: () => invalidate(),
  });

  return { add, toggle, remove };
}
