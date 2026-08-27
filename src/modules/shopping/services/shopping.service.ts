import { supabase } from "@/integrations/supabase/client";
import type { ShoppingItem } from "@/shared/types";

export async function listShopping(homeId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("home_id", homeId)
    .order("bought", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listUrgentShopping(homeId: string, limit = 3) {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, name")
    .eq("home_id", homeId)
    .eq("bought", false)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createShopping(
  homeId: string,
  userId: string,
  input: { name: string; category: string },
) {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome do item.");
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({ home_id: homeId, name, category: input.category, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function toggleShopping(item: Pick<ShoppingItem, "id" | "bought">) {
  const { error } = await supabase
    .from("shopping_items")
    .update({
      bought: !item.bought,
      bought_at: !item.bought ? new Date().toISOString() : null,
    })
    .eq("id", item.id);
  if (error) throw error;
}

export async function deleteShopping(id: string) {
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) throw error;
}
