import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/shared/types";
import { nextOccurrenceDate } from "@/shared/utils/recurrence";

export async function listTasks(homeId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("home_id", homeId)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function listTodayTasks(homeId: string, limit = 6) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, completed, category")
    .eq("home_id", homeId)
    .or(`due_date.eq.${today},due_date.is.null`)
    .order("completed", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type CreateTaskInput = {
  title: string;
  category: string;
  due_date?: string | null;
  recurrence?: string | null;
  priority?: string | null;
};

export async function createTask(homeId: string, userId: string, input: CreateTaskInput) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      home_id: homeId,
      title: input.title,
      category: input.category,
      due_date: input.due_date || null,
      recurrence: input.recurrence || null,
      priority: input.priority || "none",
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export type UpdateTaskInput = Partial<{
  title: string;
  category: string;
  due_date: string | null;
  recurrence: string | null;
  priority: string;
  description: string | null;
}>;

export async function updateTask(id: string, patch: UpdateTaskInput) {
  const payload = { ...patch };
  if ("due_date" in payload) payload.due_date = payload.due_date || null;
  if ("recurrence" in payload) payload.recurrence = payload.recurrence || null;
  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function setTaskCompleted(taskId: string, userId: string, next: boolean) {
  if (!next) {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: false, completed_at: null, completed_by: null })
      .eq("id", taskId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("tasks")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("id", taskId);
  if (error) throw error;
  return;
}

/**
 * Cria a próxima ocorrência de uma tarefa recorrente. Só é chamada quando o
 * usuário confirma explicitamente (nunca automaticamente), evitando duplicar
 * a mesma ocorrência.
 */
export async function createNextOccurrence(
  homeId: string,
  userId: string,
  task: Pick<Task, "title" | "category" | "recurrence" | "due_date" | "priority">,
) {
  const nextDue = nextOccurrenceDate(task.recurrence, task.due_date);
  if (!nextDue) return null;
  return createTask(homeId, userId, {
    title: task.title,
    category: task.category ?? "Outros",
    due_date: nextDue,
    recurrence: task.recurrence ?? null,
    priority: task.priority ?? "none",
  });
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
