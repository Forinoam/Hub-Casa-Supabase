/**
 * Helpers de atualização otimista para React Query.
 *
 * Fluxo padrão de uma mutation otimista:
 *   onMutate  → cancela refetches, guarda snapshot e aplica a mudança na UI
 *   onError   → restaura o snapshot (rollback) e mostra o erro
 *   onSettled → invalida as chaves para reconciliar com o servidor
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type OptimisticSnapshot = { snapshots: Array<[QueryKey, unknown]> };

/** Aplica `updater` em todas as `keys` guardando o estado anterior. */
export async function applyOptimistic<T>(
  qc: QueryClient,
  keys: QueryKey[],
  updater: (old: T | undefined) => T | undefined,
): Promise<OptimisticSnapshot> {
  const snapshots: Array<[QueryKey, unknown]> = [];
  for (const key of keys) {
    await qc.cancelQueries({ queryKey: key });
    snapshots.push([key, qc.getQueryData(key)]);
    qc.setQueryData<T>(key, (old) => updater(old));
  }
  return { snapshots };
}

/** Restaura o cache exatamente como estava antes da mutation. */
export function rollbackOptimistic(qc: QueryClient, ctx?: OptimisticSnapshot | null) {
  if (!ctx) return;
  for (const [key, value] of ctx.snapshots) qc.setQueryData(key, value);
}

type WithId = { id: string };

/** Atualiza um item da lista pelo id. */
export function patchItem<T extends WithId>(id: string, patch: Partial<T>) {
  return (old: T[] | undefined) => old?.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

/** Remove um item da lista pelo id. */
export function removeItem<T extends WithId>(id: string) {
  return (old: T[] | undefined) => old?.filter((item) => item.id !== id);
}

/** Insere um item no topo da lista. */
export function prependItem<T>(item: T) {
  return (old: T[] | undefined) => [item, ...(old ?? [])];
}
