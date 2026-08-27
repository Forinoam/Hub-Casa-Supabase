import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "house_summary",
  title: "Resumo da casa",
  description:
    "Retorna um panorama da casa: tarefas pendentes/atrasadas, compras faltando, contas em aberto, manutenções e próximos compromissos.",
  inputSchema: {
    home_id: z.string().uuid().optional().describe("Id da casa. Omitido = casa padrão do usuário."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ home_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    const [tasks, shopping, expenses, maintenance, events] = await Promise.all([
      supabase.from("tasks").select("title, completed, due_date, priority").eq("home_id", homeId).eq("completed", false).limit(50),
      supabase.from("shopping_items").select("name, quantity, unit, priority").eq("home_id", homeId).eq("bought", false).limit(50),
      supabase.from("expenses").select("description, amount, due_date, paid").eq("home_id", homeId).eq("paid", false).limit(50),
      supabase.from("maintenance_items").select("name, next_due").eq("home_id", homeId).limit(50),
      supabase.from("events").select("title, start_at, status").eq("home_id", homeId).gte("start_at", nowIso).order("start_at").limit(10),
    ]);

    const taskRows = tasks.data ?? [];
    const expRows = expenses.data ?? [];

    return ok({
      home_id: homeId,
      tarefas_pendentes: taskRows.length,
      tarefas_atrasadas: taskRows.filter((t) => t.due_date && t.due_date < today).length,
      tarefas: taskRows.slice(0, 10),
      compras_pendentes: shopping.data ?? [],
      contas_em_aberto: expRows,
      total_em_aberto: expRows.reduce((s, e) => s + Number(e.amount ?? 0), 0),
      manutencoes: maintenance.data ?? [],
      proximos_compromissos: events.data ?? [],
    });
  },
});
