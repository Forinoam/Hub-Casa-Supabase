/**
 * Busca universal — regras puras (sem React) para filtrar itens de vários
 * módulos por texto e ordená-los por relevância.
 */
export type SearchKind = "task" | "event" | "shopping" | "bill";

export type SearchItem = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  to: string;
};

export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  task: "Tarefas",
  event: "Agenda",
  shopping: "Compras",
  bill: "Financeiro",
};

/** Normaliza texto: minúsculas e sem acentos. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Filtra por prefixo/substring. Itens cujo título começa com o termo
 * aparecem antes dos que apenas o contêm.
 */
export function searchItems(items: SearchItem[], query: string, limit = 20): SearchItem[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: Array<{ item: SearchItem; score: number }> = [];
  for (const item of items) {
    const title = normalize(item.title);
    const subtitle = normalize(item.subtitle ?? "");
    let score = -1;
    if (title.startsWith(q)) score = 0;
    else if (title.includes(q)) score = 1;
    else if (subtitle.includes(q)) score = 2;
    if (score >= 0) scored.push({ item, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((s) => s.item);
}

/** Agrupa os resultados por módulo, preservando a ordem de relevância. */
export function groupByKind(items: SearchItem[]): Array<[SearchKind, SearchItem[]]> {
  const order: SearchKind[] = ["task", "event", "shopping", "bill"];
  return order
    .map((kind) => [kind, items.filter((i) => i.kind === kind)] as [SearchKind, SearchItem[]])
    .filter(([, list]) => list.length > 0);
}
