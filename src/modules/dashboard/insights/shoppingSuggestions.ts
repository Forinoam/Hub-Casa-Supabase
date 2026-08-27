import type { Event as CalendarEvent } from "@/shared/types";
import type { Insight } from "./types";

/**
 * Regra simples (sem IA): compromissos com palavras-chave ("churrasco",
 * "festa", "aniversário", "jantar") sugerem preparar a lista de compras.
 * Nada é adicionado automaticamente — a sugestão só aparece no dashboard.
 */
const EVENT_KEYWORDS = ["churrasco", "festa", "aniversário", "aniversario", "jantar", "reunião", "reuniao"];

export function buildShoppingSuggestionInsights(input: { events: CalendarEvent[] }): Insight[] {
  const insights: Insight[] = [];

  const upcoming = input.events.filter((e) => {
    const title = e.title.toLowerCase();
    return EVENT_KEYWORDS.some((kw) => title.includes(kw));
  });
  if (upcoming.length > 0) {
    insights.push({
      id: "insight-shopping-from-events",
      kind: "shoppingSuggestion",
      severity: 1,
      title: `Você tem "${upcoming[0].title}" na agenda`,
      description: "Que tal montar uma lista de compras para o evento?",
      route: "/compras",
    });
  }
  return insights;
}
