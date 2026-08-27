import type { PriorityItem } from "./priorities";
import type { HouseIndex } from "./houseIndex";

/**
 * Rule-based "Sugestão do Casa Hub" — a single actionable sentence surfaced
 * on the dashboard. Kept intentionally simple; the AI module can replace the
 * generator later without touching the UI.
 */
export function buildSuggestion(input: {
  priorities: PriorityItem[];
  house: HouseIndex;
  overdueBillsCount: number;
}): string {
  const { priorities, house, overdueBillsCount } = input;

  if (overdueBillsCount > 0) return `Você tem ${overdueBillsCount} conta(s) vencida(s). Vale abrir o financeiro agora.`;
  const overdueTasks = priorities.filter((p) => p.kind === "task" && p.severity === 3).length;
  if (overdueTasks > 0) return `Existem ${overdueTasks} tarefa(s) atrasada(s). Comece por elas para destravar o dia.`;
  if (priorities.length === 0 && house.score >= 90) return `Casa em ótimo estado hoje. Aproveite para registrar uma memória.`;
  if (priorities.length > 0) return `Foque nas ${Math.min(priorities.length, 3)} prioridades do dia. Você resolve rápido.`;
  return `Está tudo tranquilo. Uma boa hora para planejar a semana.`;
}
