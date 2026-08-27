import { supabase } from "@/integrations/supabase/client";
import type { Event } from "@/shared/types";
import { nextOccurrenceDateTime } from "@/shared/utils/recurrence";

export type EventVisibility = "shared" | "personal";
export type EventStatus = "pending" | "done" | "cancelled";

/**
 * Compromissos visíveis para o usuário. O RLS já esconde os pessoais de
 * outros moradores; aqui trazemos também os que já passaram e continuam
 * pendentes, para o fluxo "o compromisso foi realizado?".
 */
export async function listUpcomingEvents(homeId: string): Promise<Event[]> {
  const from = new Date();
  from.setDate(from.getDate() - 30);
  from.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("home_id", homeId)
    .gte("start_at", from.toISOString())
    .order("start_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type CreateEventInput = {
  title: string;
  start_at: string;
  category: string;
  assigned_to: string | null;
  visibility: EventVisibility;
  /** null = sem lembrete; 0 = no horário; N = minutos de antecedência. */
  reminder_minutes: number | null;
  priority?: string;
  recurrence?: string | null;
};

export async function createEvent(homeId: string, userId: string, input: CreateEventInput) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      home_id: homeId,
      title: input.title,
      start_at: new Date(input.start_at).toISOString(),
      category: input.category,
      assigned_to: input.visibility === "personal" ? userId : input.assigned_to,
      visibility: input.visibility,
      shared: input.visibility === "shared",
      reminder_minutes: input.reminder_minutes,
      priority: input.priority || "none",
      recurrence: input.recurrence || null,
      status: "pending",
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export type UpdateEventInput = Partial<{
  title: string;
  start_at: string;
  category: string;
  assigned_to: string | null;
  visibility: EventVisibility;
  reminder_minutes: number | null;
  status: EventStatus;
  priority: string;
  recurrence: string | null;
}>;

export async function updateEvent(id: string, patch: UpdateEventInput) {
  const payload: {
    title?: string;
    start_at?: string;
    category?: string;
    assigned_to?: string | null;
    visibility?: EventVisibility;
    reminder_minutes?: number | null;
    status?: EventStatus;
    priority?: string;
    recurrence?: string | null;
    shared?: boolean;
    completed_at?: string | null;
  } = { ...patch };
  if ("recurrence" in patch) payload.recurrence = patch.recurrence || null;
  if (patch.start_at) payload.start_at = new Date(patch.start_at).toISOString();
  if (patch.visibility) payload.shared = patch.visibility === "shared";
  if (patch.status) payload.completed_at = patch.status === "done" ? new Date().toISOString() : null;


  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Cria a próxima ocorrência de um compromisso recorrente — sempre por ação
 * explícita do usuário, nunca automaticamente.
 */
export async function createNextEventOccurrence(
  homeId: string,
  userId: string,
  event: Pick<Event, "title" | "start_at" | "category" | "assigned_to" | "visibility" | "reminder_minutes" | "recurrence" | "priority">,
) {
  const nextStart = nextOccurrenceDateTime(event.recurrence, event.start_at);
  if (!nextStart) return null;
  return createEvent(homeId, userId, {
    title: event.title,
    start_at: nextStart,
    category: event.category ?? "compromisso",
    assigned_to: event.assigned_to ?? null,
    visibility: (event.visibility === "personal" ? "personal" : "shared") as EventVisibility,
    reminder_minutes: event.reminder_minutes ?? null,
    priority: event.priority ?? "none",
    recurrence: event.recurrence ?? null,
  });
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
