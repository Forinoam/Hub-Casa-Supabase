import type { Event, MaintenanceItem, Expense } from "@/shared/types";

export type TimelineEntry = {
  id: string;
  kind: "event" | "maintenance" | "expense";
  date: string; // ISO
  title: string;
  meta?: string;
};

/**
 * Chronological union of upcoming commitments so the user can see the next
 * week at a glance without opening the calendar.
 */
export function buildTimeline(input: {
  events: Event[];
  maintenance: MaintenanceItem[];
  expenses: Expense[];
  /** IDs de prioridade já exibidos no topo — evitados aqui para não duplicar. */
  excludeIds?: string[];
}, limit = 5): TimelineEntry[] {
  const skip = new Set(input.excludeIds ?? []);
  const now = Date.now();
  const horizon = now + 1000 * 60 * 60 * 24 * 30;
  const rows: TimelineEntry[] = [];

  input.events.forEach((e) => {
    if (skip.has(`evt-${e.id}`)) return;
    rows.push({ id: `e-${e.id}`, kind: "event", date: e.start_at, title: e.title, meta: e.category ?? undefined });
  });
  input.maintenance.forEach((m) => {
    if (!m.next_due || skip.has(`mnt-${m.id}`)) return;
    rows.push({ id: `m-${m.id}`, kind: "maintenance", date: `${m.next_due}T09:00:00`, title: m.name, meta: "Manutenção" });
  });
  input.expenses.forEach((x) => {
    if (x.paid || !x.due_date || skip.has(`exp-${x.id}`)) return;
    rows.push({ id: `x-${x.id}`, kind: "expense", date: `${x.due_date}T00:00:00`, title: x.description, meta: "Vencimento" });
  });

  return rows
    .filter((r) => {
      const t = new Date(r.date).getTime();
      return t >= now - 1000 * 60 * 60 * 12 && t <= horizon;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}
