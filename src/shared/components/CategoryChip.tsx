import { useMemo } from "react";
import { useCategories } from "@/modules/categories";

/**
 * Mapa nome → cor das categorias de um módulo. Usado para dar leitura visual
 * imediata às listas (tarefas, compras, financeiro) sem repetir consultas.
 */
export function useCategoryColors(module: string): Record<string, string> {
  const { data } = useCategories();
  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of data ?? []) {
      if (c.module === module && c.name) map[c.name] = c.color;
    }
    return map;
  }, [data, module]);
}

const FALLBACK = "#8B9D83";

/** Etiqueta compacta com a cor da categoria personalizada da casa. */
export function CategoryChip({
  name,
  module,
  className = "",
}: {
  name?: string | null;
  module: string;
  className?: string;
}) {
  const colors = useCategoryColors(module);
  if (!name) return null;
  const color = colors[name] ?? FALLBACK;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {name}
    </span>
  );
}
