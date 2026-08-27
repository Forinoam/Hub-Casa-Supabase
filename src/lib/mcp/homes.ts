import { ToolError } from "@lovable.dev/mcp-js";
import type { McpSupabase } from "./supabase";

/**
 * Resolves which house the caller is acting on. RLS already limits
 * `home_members` to the signed-in user, so a missing id falls back to their
 * first (usually only) house.
 */
export async function resolveHomeId(supabase: McpSupabase, homeId?: string): Promise<string> {
  if (homeId) return homeId;
  const { data, error } = await supabase
    .from("home_members")
    .select("home_id")
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw new ToolError(error.message);
  const resolved = data?.[0]?.home_id;
  if (!resolved) throw new ToolError("Nenhuma casa encontrada para este usuário.");
  return resolved;
}

export function ok(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}
