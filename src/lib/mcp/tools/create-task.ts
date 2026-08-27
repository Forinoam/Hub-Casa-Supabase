import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "create_task",
  title: "Criar tarefa",
  description: "Cria uma nova tarefa compartilhada na casa.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Título da tarefa."),
    home_id: z.string().uuid().optional(),
    description: z.string().optional(),
    category: z.string().optional().describe("Categoria, ex: limpeza, cozinha."),
    priority: z.enum(["low", "medium", "high"]).optional(),
    due_date: z.string().optional().describe("Data no formato YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, home_id, description, category, priority, due_date }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        home_id: homeId,
        created_by: ctx.getUserId()!,
        title,
        description: description ?? null,
        category: category ?? "geral",
        priority: priority ?? "medium",
        due_date: due_date ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ task: data });
  },
});
