import type { Task } from "@/shared/types";
import { todayKey } from "@/shared/utils/format";

/** Níveis de urgência derivados APENAS da proximidade da data. */
export type TaskUrgency = "overdue" | "today" | "soon" | "near" | "far" | "none";

/**
 * Domain behaviors for tasks. Keeps rendering-agnostic logic out of the UI.
 */
export const TaskModel = {
  isCompleted(t: Pick<Task, "completed">): boolean {
    return !!t.completed;
  },
  isToday(t: Pick<Task, "due_date">): boolean {
    if (!t.due_date) return false;
    return t.due_date === todayKey();
  },
  isOverdue(t: Pick<Task, "due_date" | "completed">): boolean {
    if (t.completed || !t.due_date) return false;
    return t.due_date < todayKey();
  },
  /** Dias inteiros até o vencimento (negativo = atrasada). */
  daysUntilDue(t: Pick<Task, "due_date">): number | null {
    if (!t.due_date) return null;
    const due = new Date(`${t.due_date}T00:00:00`).getTime();
    const today = new Date(`${todayKey()}T00:00:00`).getTime();
    return Math.round((due - today) / 86_400_000);
  },
  /**
   * Urgência pela data — conceito separado da prioridade manual:
   *   hoje/atrasada → máxima; 1–3 dias → alta; 4–10 dias → média; +10 → baixa.
   */
  urgency(t: Pick<Task, "due_date" | "completed">): TaskUrgency {
    if (t.completed) return "none";
    const days = TaskModel.daysUntilDue(t);
    if (days === null) return "none";
    if (days < 0) return "overdue";
    if (days === 0) return "today";
    if (days <= 3) return "soon";
    if (days <= 10) return "near";
    return "far";
  },
};

/** Degradê visual discreto por urgência (borda esquerda + rótulo). */
export const URGENCY_STYLES: Record<TaskUrgency, { bar: string; text: string; label: string | null }> = {
  overdue: { bar: "bg-clay-600", text: "text-clay-600", label: "Atrasada" },
  today: { bar: "bg-clay-600/70", text: "text-clay-600", label: "Hoje" },
  soon: { bar: "bg-[#D4A574]", text: "text-[#8A6437]", label: "Em breve" },
  near: { bar: "bg-sage-800/40", text: "text-sage-800/60", label: null },
  far: { bar: "bg-sage-200", text: "text-sage-800/50", label: null },
  none: { bar: "bg-transparent", text: "text-sage-800/50", label: null },
};
