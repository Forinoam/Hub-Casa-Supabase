import { supabase } from "@/integrations/supabase/client";
import type { PaymentCard } from "@/shared/types";

export async function listCards(homeId: string): Promise<PaymentCard[]> {
  const { data, error } = await supabase
    .from("payment_cards")
    .select("*")
    .eq("home_id", homeId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export type CardInput = {
  name: string;
  brand?: string | null;
  last4?: string | null;
  color?: string;
  closing_day?: number | null;
  due_day?: number | null;
};

export async function createCard(homeId: string, userId: string, input: CardInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Dê um nome ao cartão.");
  const { data, error } = await supabase
    .from("payment_cards")
    .insert({
      home_id: homeId,
      name,
      brand: input.brand || null,
      last4: input.last4 || null,
      color: input.color || "#8B9D83",
      closing_day: input.closing_day ?? null,
      due_day: input.due_day ?? null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCard(id: string, patch: Partial<CardInput>) {
  const { data, error } = await supabase
    .from("payment_cards")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from("payment_cards").delete().eq("id", id);
  if (error) throw error;
}
