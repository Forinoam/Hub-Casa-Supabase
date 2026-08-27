import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ferramentas que a IA da Casa pode executar de verdade. Cada uma roda com o
 * cliente Supabase autenticado do usuário (RLS aplicada), então a IA nunca
 * consegue tocar em dados de outra casa.
 *
 * Os schemas seguem o contrato "strict" da Responses API: todo campo aparece
 * em `required` e opcionais são nulos (nunca omitidos).
 */
type AnySupabase = SupabaseClient<any, any, any>;

const strictObject = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const nullable = (type: string, description: string) => ({ type: [type, "null"], description });

export const HOME_TOOL_SCHEMAS = [
  {
    type: "function",
    name: "criar_tarefa",
    description: "Cria uma nova tarefa na casa.",
    strict: true,
    parameters: strictObject({
      title: { type: "string", description: "Título da tarefa." },
      category: nullable("string", "Categoria. Nulo usa 'Outros'."),
      due_date: nullable("string", "Data no formato yyyy-mm-dd, ou nulo."),
      recurrence: nullable("string", "daily, weekly, monthly ou nulo."),
    }),
  },
  {
    type: "function",
    name: "concluir_tarefa",
    description: "Marca uma tarefa existente como concluída, buscando pelo título.",
    strict: true,
    parameters: strictObject({
      title: { type: "string", description: "Título (ou parte dele) da tarefa a concluir." },
    }),
  },
  {
    type: "function",
    name: "adicionar_item_compras",
    description: "Adiciona um item à lista de compras da casa.",
    strict: true,
    parameters: strictObject({
      name: { type: "string", description: "Nome do item." },
      quantity: nullable("number", "Quantidade. Nulo = 1."),
      category: nullable("string", "Categoria. Nulo usa 'Mercado'."),
    }),
  },
  {
    type: "function",
    name: "criar_despesa",
    description: "Registra uma conta/despesa da casa.",
    strict: true,
    parameters: strictObject({
      description: { type: "string", description: "Descrição da despesa." },
      amount: { type: "number", description: "Valor em reais." },
      category: nullable("string", "Categoria. Nulo usa 'Outros'."),
      due_date: nullable("string", "Vencimento yyyy-mm-dd, ou nulo."),
      recurrence: nullable("string", "weekly, monthly, yearly ou nulo."),
    }),
  },
  {
    type: "function",
    name: "criar_compromisso",
    description: "Cria um compromisso na agenda compartilhada da casa.",
    strict: true,
    parameters: strictObject({
      title: { type: "string", description: "Título do compromisso." },
      start_at: { type: "string", description: "Data/hora de início em ISO 8601." },
      category: nullable("string", "Categoria, ou nulo."),
    }),
  },
] as const;

export type ToolResult = { ok: boolean; message: string };

export async function executeHomeTool(
  name: string,
  args: Record<string, any>,
  ctx: { supabase: AnySupabase; homeId: string; userId: string },
): Promise<ToolResult> {
  const { supabase, homeId, userId } = ctx;
  try {
    switch (name) {
      case "criar_tarefa": {
        const { error } = await supabase.from("tasks").insert({
          home_id: homeId,
          title: String(args.title),
          category: args.category || "Outros",
          due_date: args.due_date || null,
          recurrence: args.recurrence || null,
          created_by: userId,
        });
        if (error) throw error;
        return { ok: true, message: `Tarefa "${args.title}" criada.` };
      }
      case "concluir_tarefa": {
        const { data, error } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("home_id", homeId)
          .eq("completed", false)
          .ilike("title", `%${String(args.title)}%`)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, message: `Nenhuma tarefa pendente parecida com "${args.title}".` };
        const upd = await supabase
          .from("tasks")
          .update({ completed: true, completed_at: new Date().toISOString(), completed_by: userId })
          .eq("id", data.id);
        if (upd.error) throw upd.error;
        return { ok: true, message: `Tarefa "${data.title}" concluída.` };
      }
      case "adicionar_item_compras": {
        const { error } = await supabase.from("shopping_items").insert({
          home_id: homeId,
          name: String(args.name),
          quantity: Number(args.quantity ?? 1) || 1,
          category: args.category || "Mercado",
          priority: "medium",
          created_by: userId,
        });
        if (error) throw error;
        return { ok: true, message: `"${args.name}" adicionado à lista de compras.` };
      }
      case "criar_despesa": {
        const kind = args.due_date || args.recurrence ? "bill" : "spend";
        const today = new Date().toISOString().slice(0, 10);
        const { error } = await supabase.from("expenses").insert({
          home_id: homeId,
          description: String(args.description),
          amount: Number(args.amount),
          category: args.category || "Outros",
          due_date: kind === "spend" ? today : args.due_date || null,
          recurrence: kind === "spend" ? null : args.recurrence || null,
          paid: kind === "spend",
          kind,
          created_by: userId,
        });
        if (error) throw error;
        return { ok: true, message: `Despesa "${args.description}" registrada.` };
      }
      case "criar_compromisso": {
        const { error } = await supabase.from("events").insert({
          home_id: homeId,
          title: String(args.title),
          start_at: String(args.start_at),
          category: args.category || null,
          created_by: userId,
        });
        if (error) throw error;
        return { ok: true, message: `Compromisso "${args.title}" criado.` };
      }
      default:
        return { ok: false, message: `Ferramenta desconhecida: ${name}` };
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Falha ao executar a ação." };
  }
}
