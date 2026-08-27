import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "list_shopping_items",
  title: "Listar lista de compras",
  description: "Lista os itens da lista de compras da casa.",
  inputSchema: {
    home_id: z.string().uuid().optional(),
    bought: z.boolean().optional().describe("Filtra por já comprados (true) ou pendentes (false)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ home_id, bought }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    let query = supabase
      .from("shopping_items")
      .select("id, name, quantity, unit, category, priority, bought, note")
      .eq("home_id", homeId)
      .limit(100);
    if (typeof bought === "boolean") query = query.eq("bought", bought);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ home_id: homeId, items: data ?? [] });
  },
});
