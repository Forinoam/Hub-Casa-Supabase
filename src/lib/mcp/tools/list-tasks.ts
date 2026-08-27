import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "list_tasks",
  title: "Listar tarefas",
  description: "Lista tarefas da casa, opcionalmente filtrando por status de conclusão.",
  inputSchema: {
    home_id: z.string().uuid().optional(),
    completed: z.boolean().optional().describe("Filtra por concluídas (true) ou pendentes (false)."),
    limit: z.number().int().optional().describe("Máximo de tarefas (padrão 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ home_id, completed, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    let query = supabase
      .from("tasks")
      .select("id, title, description, category, priority, due_date, due_time, completed, points, assignee")
      .eq("home_id", homeId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));
    if (typeof completed === "boolean") query = query.eq("completed", completed);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ home_id: homeId, tasks: data ?? [] });
  },
});
