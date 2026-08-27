import { supabase } from "@/integrations/supabase/client";

/**
 * Preferências de notificação por usuário/casa.
 * Leitura/escrita direta pelo cliente (RLS restringe ao próprio usuário).
 */
export type NotificationPreferences = {
  id: string;
  home_id: string;
  user_id: string;
  enabled_events: boolean;
  enabled_tasks: boolean;
  enabled_bills: boolean;
  enabled_maintenance: boolean;
  enabled_shopping: boolean;
  enabled_budget: boolean;
  daily_digest_time: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  shopping_weekday: number;
  bill_lead_days: number;
  maintenance_lead_days: number;
};

const SELECT =
  "id, home_id, user_id, enabled_events, enabled_tasks, enabled_bills, enabled_maintenance, enabled_shopping, enabled_budget, daily_digest_time, quiet_hours_start, quiet_hours_end, shopping_weekday, bill_lead_days, maintenance_lead_days";

/** Busca as preferências; cria o registro padrão na primeira vez. */
export async function loadNotificationPreferences(
  homeId: string,
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(SELECT)
    .eq("home_id", homeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as NotificationPreferences;

  const { data: created, error: createError } = await supabase
    .from("notification_preferences")
    .insert({ home_id: homeId, user_id: userId })
    .select(SELECT)
    .single();
  if (createError) throw createError;
  return created as NotificationPreferences;
}

export type NotificationPreferencesPatch = Partial<
  Omit<NotificationPreferences, "id" | "home_id" | "user_id">
>;

export async function saveNotificationPreferences(
  id: string,
  patch: NotificationPreferencesPatch,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as NotificationPreferences;
}

export type NotificationDelivery = {
  id: string;
  source_type: string;
  scheduled_for: string;
  sent_at: string | null;
  status: string;
  error: string | null;
  payload: { title?: string; body?: string; url?: string } | null;
};

export async function listNotificationHistory(
  homeId: string,
  limit = 12,
): Promise<NotificationDelivery[]> {
  const { data, error } = await supabase
    .from("notification_deliveries")
    .select("id, source_type, scheduled_for, sent_at, status, error, payload")
    .eq("home_id", homeId)
    .order("scheduled_for", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as NotificationDelivery[];
}

export const SOURCE_LABELS: Record<string, string> = {
  event: "Compromisso",
  task: "Tarefa",
  bill: "Conta a pagar",
  maintenance: "Manutenção",
  shopping: "Lista de compras",
  budget: "Orçamento",
  test: "Teste",
};

export const STATUS_LABELS: Record<string, string> = {
  queued: "Na fila",
  sent: "Enviada",
  failed: "Falhou",
  skipped: "Ignorada",
};
