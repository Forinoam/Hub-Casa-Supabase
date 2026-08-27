import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "add_shopping_item",
  title: "Adicionar item de compra",
  description: "Adiciona um item à lista de compras da casa.",
  inputSchema: {
    name: z.string().trim().min(1),
    home_id: z.string().uuid().optional(),
    quantity: z.number().optional().describe("Padrão 1."),
    unit: z.string().optional(),
    category: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    note: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, home_id, quantity, unit, category, priority, note }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        home_id: homeId,
        created_by: ctx.getUserId()!,
        name,
        quantity: quantity ?? 1,
        unit: unit ?? null,
        category: category ?? "geral",
        priority: priority ?? "medium",
        note: note ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ item: data });
  },
});
