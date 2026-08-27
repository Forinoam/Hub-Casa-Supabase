import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/shared/types";

export async function listCategories(homeId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("home_id", homeId)
    .order("module")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export type CreateCategoryInput = {
  name: string;
  color: string;
  module: string;
};

export async function createCategory(homeId: string, userId: string, input: CreateCategoryInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome da categoria.");
  const { data, error } = await supabase
    .from("categories")
    .insert({
      home_id: homeId,
      name,
      color: input.color,
      module: input.module,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
