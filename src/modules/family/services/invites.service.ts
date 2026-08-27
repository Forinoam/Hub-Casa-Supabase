/**
 * Invites — real implementation backed by `public.home_invites` and the
 * `accept_home_invite` RPC. Admin-only writes are enforced by RLS.
 */
import { supabase } from "@/integrations/supabase/client";
import { toUserMessage } from "@/shared/utils/errors";
import type { HomeRole } from "@/shared/services/home.service";

export type Invite = {
  id: string;
  home_id: string;
  home_name?: string;
  email: string;
  code: string;
  role: HomeRole;
  status: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export const INVITES_ENABLED = true;

/** Invites issued by the given home (admins only, per RLS). */
export async function listInvites(homeId: string): Promise<Invite[]> {
  const { data, error } = await supabase
    .from("home_invites")
    .select("*")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(toUserMessage(error, "Não consegui carregar os convites."));
  return (data ?? []) as Invite[];
}

/** Pending invites addressed to the signed-in user's e-mail. */
export async function listMyInvites(): Promise<Invite[]> {
  const { data, error } = await supabase
    .from("home_invites")
    .select("*, homes(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(toUserMessage(error, "Não consegui carregar seus convites."));
  return (data ?? []).map((row) => {
    const { homes, ...rest } = row as Record<string, unknown> & {
      homes?: { name?: string } | null;
    };
    return { ...(rest as unknown as Invite), home_name: homes?.name ?? "Casa" };
  });
}

export async function createInvite(
  homeId: string,
  email: string,
  role: HomeRole = "member",
): Promise<Invite> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Faça login novamente para continuar.");

  const { data, error } = await supabase
    .from("home_invites")
    .insert({
      home_id: homeId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: userData.user.id,
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Já existe um convite pendente para esse e-mail."
        : toUserMessage(error, "Não consegui criar o convite."),
    );
  }
  return data as Invite;
}

export async function revokeInvite(id: string): Promise<void> {
  const { error } = await supabase
    .from("home_invites")
    .update({ status: "revoked" })
    .eq("id", id);
  if (error) throw new Error(toUserMessage(error, "Não consegui cancelar o convite."));
}

/** Accepts an invite by code and returns the home id the user joined. */
export async function acceptInvite(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_home_invite", {
    _code: code.trim(),
  });
  if (error) throw new Error(toUserMessage(error, "Não consegui aceitar o convite."));
  return data as unknown as string;
}
