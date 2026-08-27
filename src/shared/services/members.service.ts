import { supabase } from "@/integrations/supabase/client";
import type { MemberWithProfile } from "@/shared/types";
import { toUserMessage } from "@/shared/utils/errors";
import type { HomeRole } from "./home.service";

export async function fetchHomeMembers(homeId: string): Promise<MemberWithProfile[]> {
  const { data: memberRows, error } = await supabase
    .from("home_members")
    .select("user_id, role, created_at")
    .eq("home_id", homeId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const ids = (memberRows ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);
  if (profileError) throw profileError;

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return (memberRows ?? []).map((m) => {
    const p = byId.get(m.user_id);
    return {
      user_id: m.user_id,
      role: m.role,
      joined_at: m.created_at,
      name: p?.display_name ?? "Morador",
      avatar_url: p?.avatar_url ?? null,
    };
  });
}

/** Admin-only: promote/demote a member. RLS enforces the permission. */
export async function updateMemberRole(
  homeId: string,
  userId: string,
  role: HomeRole,
): Promise<void> {
  const { error } = await supabase
    .from("home_members")
    .update({ role })
    .eq("home_id", homeId)
    .eq("user_id", userId);
  if (error) throw new Error(toUserMessage(error, "Não consegui alterar o papel."));
}

/** Admin-only (or self, to leave the house). */
export async function removeMember(homeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("home_members")
    .delete()
    .eq("home_id", homeId)
    .eq("user_id", userId);
  if (error) throw new Error(toUserMessage(error, "Não consegui remover o morador."));
}

/**
 * Ownership transfer: the new owner is promoted and the previous owner becomes
 * an admin. Executed as two updates guarded by the admin RLS policy.
 */
export async function transferOwnership(
  homeId: string,
  currentOwnerId: string,
  nextOwnerId: string,
): Promise<void> {
  await updateMemberRole(homeId, nextOwnerId, "owner");
  await updateMemberRole(homeId, currentOwnerId, "admin");
}
