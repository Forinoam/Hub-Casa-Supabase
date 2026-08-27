import type { Task, ShoppingItem, Expense, MaintenanceItem } from "@/shared/types";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { ExpenseModel } from "@/modules/finance/models/expense.model";

export type HouseIndex = {
  score: number;              // 0–100
  label: string;              // "Excelente", "Boa", "Atenção", "Crítica"
  tone: "sage" | "clay" | "amber";
  breakdown: Array<{ id: string; label: string; score: number }>;
};

const ratio = (good: number, total: number) => (total <= 0 ? 1 : Math.max(0, Math.min(1, good / total)));

/**
 * Composite "House Index" placeholder. Weights are deliberately simple; the
 * structure exists so the future automation/AI layer can plug richer signals.
 */
export function computeHouseIndex(input: {
  tasks: Task[];
  shopping: ShoppingItem[];
  expenses: Expense[];
  maintenance: MaintenanceItem[];
}): HouseIndex {
  // Tarefas: atrasadas pesam integralmente; pendentes sem data pesam metade,
  // para que uma casa cheia de tarefas soltas também apareça no índice.
  const activeTasks = input.tasks.filter((t) => !t.completed);
  const overdueTasks = activeTasks.filter((t) => TaskModel.isOverdue(t)).length;
  const undatedTasks = activeTasks.filter((t) => !t.due_date).length;
  const tasksPenalty = overdueTasks + undatedTasks * 0.5;
  const tasksScore = ratio(activeTasks.length - tasksPenalty, activeTasks.length);

  const pendingShopping = input.shopping.filter((s) => !s.bought).length;
  const shoppingScore = pendingShopping === 0 ? 1 : ratio(Math.max(0, 8 - pendingShopping), 8);

  // Finanças: só contas (bill) entram; gastos já realizados não penalizam.
  const unpaid = input.expenses.filter((e) => !e.paid && ExpenseModel.isBill(e));
  const overdueBills = unpaid.filter((e) => ExpenseModel.isOverdue(e)).length;
  const undatedBills = unpaid.filter((e) => !e.due_date).length;
  const financePenalty = overdueBills + undatedBills * 0.5;
  const financeScore = unpaid.length === 0 ? 1 : ratio(unpaid.length - financePenalty, unpaid.length);

  const today = new Date();
  const dueSoon = input.maintenance.filter((m) => {
    if (!m.next_due) return false;
    const d = new Date(`${m.next_due}T00:00:00`);
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  }).length;
  const maintenanceScore =
    input.maintenance.length === 0 ? 1 : ratio(input.maintenance.length - dueSoon, input.maintenance.length);

  const breakdown = [
    { id: "tasks", label: "Tarefas", score: Math.round(tasksScore * 100) },
    { id: "shopping", label: "Compras", score: Math.round(shoppingScore * 100) },
    { id: "finance", label: "Finanças", score: Math.round(financeScore * 100) },
    { id: "maintenance", label: "Manutenção", score: Math.round(maintenanceScore * 100) },
  ];

  const score = Math.round(
    (tasksScore * 0.35 + shoppingScore * 0.2 + financeScore * 0.28 + maintenanceScore * 0.17) *
      100,
  );

  let label = "Excelente";
  let tone: HouseIndex["tone"] = "sage";
  if (score < 55) { label = "Precisa de atenção"; tone = "clay"; }
  else if (score < 75) { label = "Boa, com pontos a cuidar"; tone = "amber"; }
  else if (score < 90) { label = "Muito boa"; tone = "sage"; }

  return { score, label, tone, breakdown };
}
