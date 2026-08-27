import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { ok, resolveHomeId } from "../homes";

export default defineTool({
  name: "list_homes",
  title: "Listar casas",
  description: "Lista as casas (households) das quais o usuário autenticado é membro.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("homes").select("id, name, created_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const active = await resolveHomeId(supabase).catch(() => null);
    return ok({ homes: data ?? [], default_home_id: active });
  },
});
