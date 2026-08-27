import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "list_events",
  title: "Listar compromissos",
  description: "Lista os compromissos da agenda da casa a partir de agora (ou de uma data inicial).",
  inputSchema: {
    home_id: z.string().uuid().optional(),
    from: z.string().optional().describe("Data/hora ISO inicial. Padrão: agora."),
    limit: z.number().int().optional().describe("Padrão 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ home_id, from, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, start_at, end_at, status, visibility, assigned_to, category")
      .eq("home_id", homeId)
      .gte("start_at", from ?? new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ home_id: homeId, events: data ?? [] });
  },
});
