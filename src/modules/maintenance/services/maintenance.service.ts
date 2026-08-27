import { supabase } from "@/integrations/supabase/client";
import type { MaintenanceItem } from "@/shared/types";

export async function listMaintenance(homeId: string): Promise<MaintenanceItem[]> {
  const { data, error } = await supabase
    .from("maintenance_items")
    .select("*")
    .eq("home_id", homeId)
    .order("next_due", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function nextMaintenance(homeId: string) {
  const { data, error } = await supabase
    .from("maintenance_items")
    .select("id, name, next_due")
    .eq("home_id", homeId)
    .not("next_due", "is", null)
    .order("next_due", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMaintenance(
  homeId: string,
  input: { name: string; next_due?: string | null; last_done?: string | null; interval_days?: number | null },
) {
  const { data, error } = await supabase
    .from("maintenance_items")
    .insert({
      home_id: homeId,
      name: input.name,
      next_due: input.next_due || null,
      last_done: input.last_done || null,
      interval_days: input.interval_days ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Marca uma manutenção como concluída AGORA e, se `interval_days` estiver
 * definido, agenda automaticamente a próxima ocorrência (hoje + intervalo).
 * Retorna o novo `next_due` (ISO yyyy-mm-dd) ou `null` quando não recorrente.
 */
export async function completeMaintenance(item: Pick<MaintenanceItem, "id" | "interval_days">) {
  const todayIso = new Date().toISOString().slice(0, 10);
  let nextDue: string | null = null;
  if (item.interval_days && item.interval_days > 0) {
    const d = new Date();
    d.setDate(d.getDate() + item.interval_days);
    nextDue = d.toISOString().slice(0, 10);
  }
  const { error } = await supabase
    .from("maintenance_items")
    .update({ last_done: todayIso, next_due: nextDue })
    .eq("id", item.id);
  if (error) throw error;
  return { nextDue };
}

export async function deleteMaintenance(id: string) {
  const { error } = await supabase.from("maintenance_items").delete().eq("id", id);
  if (error) throw error;
}
