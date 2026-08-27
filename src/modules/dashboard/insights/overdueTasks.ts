import type { Task } from "@/shared/types";
import { TaskModel } from "@/modules/tasks/models/task.model";
import type { Insight } from "./types";

export function buildOverdueTasksInsight(tasks: Task[]): Insight | null {
  const overdue = tasks.filter((t) => TaskModel.isOverdue(t));
  if (overdue.length === 0) return null;
  return {
    id: "insight-overdue-tasks",
    kind: "overdueTasks",
    severity: 3,
    title: `${overdue.length} tarefa(s) atrasada(s)`,
    description: overdue.slice(0, 3).map((t) => t.title).join(", "),
    route: "/tarefas",
  };
}
