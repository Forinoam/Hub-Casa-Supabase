import { supabase } from "@/integrations/supabase/client";
import type { Budget } from "@/shared/types";

export async function listBudgets(homeId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("home_id", homeId)
    .order("category");
  if (error) throw error;
  return data ?? [];
}

export type UpsertBudgetInput = { category: string; amount: number };

/** Um orçamento por categoria: se já existir, o valor é substituído. */
export async function upsertBudget(homeId: string, userId: string, input: UpsertBudgetInput) {
  const category = input.category.trim();
  if (!category) throw new Error("Escolha uma categoria.");
  if (!(input.amount > 0)) throw new Error("Informe um limite maior que zero.");
  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      { home_id: homeId, category, amount: input.amount, created_by: userId },
      { onConflict: "home_id,category" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
