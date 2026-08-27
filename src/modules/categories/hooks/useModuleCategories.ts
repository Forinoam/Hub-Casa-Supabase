import { useMemo } from "react";
import { useCategories } from "./useCategories";

/**
 * Nomes das categorias de um módulo ("tasks" | "shopping" | "expenses" |
 * "maintenance" | "events"), com fallback para a lista fixa enquanto a casa
 * ainda não tem categorias semeadas.
 */
export function useModuleCategories(module: string, fallback: string[]): string[] {
  const { data } = useCategories();
  return useMemo(() => {
    const names = (data ?? []).filter((c) => c.module === module).map((c) => c.name);
    return names.length > 0 ? names : fallback;
  }, [data, module, fallback]);
}
