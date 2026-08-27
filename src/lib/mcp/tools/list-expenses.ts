import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "list_expenses",
  title: "Listar contas e despesas",
  description: "Lista as despesas da casa, com opção de filtrar por pagas ou em aberto.",
  inputSchema: {
    home_id: z.string().uuid().optional(),
    paid: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ home_id, paid }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    let query = supabase
      .from("expenses")
      .select("id, description, amount, category, due_date, paid, recurring")
      .eq("home_id", homeId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(100);
    if (typeof paid === "boolean") query = query.eq("paid", paid);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ home_id: homeId, expenses: data ?? [] });
  },
});
