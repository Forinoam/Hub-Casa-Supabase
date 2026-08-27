import type { Task, ShoppingItem, Expense, MaintenanceItem, Event } from "@/shared/types";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { ExpenseModel } from "@/modules/finance/models/expense.model";
import { formatShortDay, formatCurrency, formatTime, todayKey } from "@/shared/utils/format";
import { PRIORITY_WEIGHT } from "@/shared/utils/constants";
import type { EntityKind } from "@/shared/utils/entity-visuals";

export type PriorityItem = {
  id: string;
  /** Tipo do registro — controla ícone/cor via `entity-visuals`. */
  kind: EntityKind;
  label: string;
  detail: string;
  route: "/tarefas" | "/compras" | "/financeiro" | "/manutencao" | "/calendario";
  severity: 1 | 2 | 3; // 3 = crítico
  /** Prioridade manual (alta/média/baixa) usada no desempate da ordenação. */
  weight: number;
  /** Data de referência (yyyy-mm-dd) para ordenar do mais antigo ao mais novo. */
  when: string;
};

const amountLabel = (e: Expense) =>
  e.amount === null || e.amount === undefined ? "valor a definir" : formatCurrency(Number(e.amount));

/**
 * Mixes signals from every module into a single prioritized list so the user
 * can act without navigating around. Ordena por severidade, depois prioridade
 * manual e por fim pela data (mais antigo primeiro). Mantém o top 5.
 */
export function buildPriorities(input: {
  tasks: Task[];
  shopping: ShoppingItem[];
  expenses: Expense[];
  maintenance: MaintenanceItem[];
  events: Event[];
}): PriorityItem[] {
  const items: PriorityItem[] = [];
  const today = todayKey();
  const in3Days = new Date(); in3Days.setDate(in3Days.getDate() + 3);
  const soonKey = in3Days.toISOString().slice(0, 10);

  input.tasks.forEach((t) => {
    if (t.completed) return;
    const weight = PRIORITY_WEIGHT[t.priority ?? "none"] ?? 0;
    if (TaskModel.isOverdue(t)) {
      items.push({ id: `task-${t.id}`, kind: "task", label: t.title, detail: `Atrasada • ${formatShortDay(t.due_date!)}`, route: "/tarefas", severity: 3, weight, when: t.due_date! });
    } else if (TaskModel.isToday(t)) {
      items.push({ id: `task-${t.id}`, kind: "task", label: t.title, detail: "Hoje", route: "/tarefas", severity: 2, weight, when: today });
    } else if (weight >= 3) {
      items.push({ id: `task-${t.id}`, kind: "task", label: t.title, detail: "Prioridade alta", route: "/tarefas", severity: 2, weight, when: t.due_date ?? soonKey });
    }
  });

  input.expenses.forEach((e) => {
    if (e.paid || !e.due_date || !ExpenseModel.isBill(e)) return;
    if (ExpenseModel.isOverdue(e)) {
      items.push({ id: `exp-${e.id}`, kind: "bill", label: e.description, detail: `Vencida • ${amountLabel(e)}`, route: "/financeiro", severity: 3, weight: 2, when: e.due_date });
    } else if (e.due_date <= soonKey) {
      items.push({ id: `exp-${e.id}`, kind: "bill", label: e.description, detail: `Vence ${formatShortDay(e.due_date)} • ${amountLabel(e)}`, route: "/financeiro", severity: 2, weight: 1, when: e.due_date });
    }
  });

  input.maintenance.forEach((m) => {
    if (!m.next_due) return;
    if (m.next_due < today) {
      items.push({ id: `mnt-${m.id}`, kind: "maintenance", label: m.name, detail: `Manutenção vencida • ${formatShortDay(m.next_due)}`, route: "/manutencao", severity: 3, weight: 1, when: m.next_due });
    } else if (m.next_due <= soonKey) {
      items.push({ id: `mnt-${m.id}`, kind: "maintenance", label: m.name, detail: `Manutenção • ${formatShortDay(m.next_due)}`, route: "/manutencao", severity: 2, weight: 0, when: m.next_due });
    }
  });

  input.shopping
    .filter((s) => !s.bought && s.priority === "high")
    .slice(0, 2)
    .forEach((s) => {
      items.push({ id: `shp-${s.id}`, kind: "shopping", label: s.name, detail: "Compra urgente", route: "/compras", severity: 2, weight: 3, when: today });
    });

  input.events.forEach((ev) => {
    if (ev.status === "done" || ev.status === "cancelled") return;
    const start = new Date(ev.start_at);
    const dayKey = start.toISOString().slice(0, 10);
    const weight = PRIORITY_WEIGHT[ev.priority ?? "none"] ?? 0;
    if (start.getTime() < Date.now() && dayKey <= today) {
      // Compromisso passou e continua pendente: precisa de decisão do usuário.
      items.push({ id: `evt-${ev.id}`, kind: "event", label: ev.title, detail: `Já passou • ${formatShortDay(dayKey)}`, route: "/calendario", severity: 3, weight, when: dayKey });
    } else if (dayKey === today) {
      items.push({ id: `evt-${ev.id}`, kind: "event", label: ev.title, detail: `Hoje • ${formatTime(ev.start_at)}`, route: "/calendario", severity: 2, weight, when: dayKey });
    }
  });

  return items
    .sort((a, b) => b.severity - a.severity || b.weight - a.weight || a.when.localeCompare(b.when))
    .slice(0, 5);
}
