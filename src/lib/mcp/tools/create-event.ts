import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "create_event",
  title: "Criar compromisso",
  description: "Cria um compromisso na agenda da casa (compartilhado ou pessoal).",
  inputSchema: {
    title: z.string().trim().min(1),
    start_at: z.string().describe("Data/hora de início em ISO 8601."),
    home_id: z.string().uuid().optional(),
    end_at: z.string().optional().describe("Data/hora de fim em ISO 8601."),
    description: z.string().optional(),
    visibility: z.enum(["shared", "private"]).optional().describe("Padrão shared (visível para a casa)."),
    reminder_minutes: z.number().int().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, start_at, home_id, end_at, description, visibility, reminder_minutes }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const homeId = await resolveHomeId(supabase, home_id);
    const vis = visibility ?? "shared";
    const { data, error } = await supabase
      .from("events")
      .insert({
        home_id: homeId,
        created_by: ctx.getUserId()!,
        title,
        start_at,
        end_at: end_at ?? null,
        description: description ?? null,
        visibility: vis,
        shared: vis === "shared",
        reminder_minutes: reminder_minutes ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return ok({ event: data });
  },
});
