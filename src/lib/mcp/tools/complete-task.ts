import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok } from "../homes";

export default defineTool({
  name: "complete_task",
  title: "Concluir tarefa",
  description: "Marca uma tarefa como concluída (ou reabre com completed=false).",
  inputSchema: {
    task_id: z.string().uuid().describe("Id da tarefa."),
    completed: z.boolean().optional().describe("Padrão true."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ task_id, completed }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const done = completed ?? true;
    const { data, error } = await supabase
      .from("tasks")
      .update({
        completed: done,
        completed_at: done ? new Date().toISOString() : null,
        completed_by: done ? ctx.getUserId()! : null,
      })
      .eq("id", task_id)
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ task: data });
  },
});
