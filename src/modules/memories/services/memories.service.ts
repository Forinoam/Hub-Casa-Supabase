import { supabase } from "@/integrations/supabase/client";
import type { Memory } from "@/shared/types";

export async function listMemories(homeId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("home_id", homeId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMemory(
  homeId: string,
  userId: string,
  input: { title: string; content: string },
) {
  const { data, error } = await supabase
    .from("memories")
    .insert({
      home_id: homeId,
      title: input.title,
      content: input.content,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMemory(id: string) {
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) throw error;
}
