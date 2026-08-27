import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SYSTEM_CHAT, SYSTEM_INSIGHT } from "../prompts/system";

const gateway = (path: string) => `https://ai.gateway.lovable.dev${path}`;

async function callLovableAI(body: unknown): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY não configurada");
  const res = await fetch(gateway("/v1/chat/completions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos da IA esgotados. Adicione créditos para continuar.");
    throw new Error(`Erro da IA: ${text}`);
  }
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

export const generateInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ homeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [tasksRes, shoppingRes, maintRes, expRes] = await Promise.all([
      supabase.from("tasks").select("title, completed, due_date, category").eq("home_id", data.homeId).limit(20),
      supabase.from("shopping_items").select("name, bought").eq("home_id", data.homeId).eq("bought", false).limit(20),
      supabase.from("maintenance_items").select("name, next_due").eq("home_id", data.homeId).limit(10),
      supabase.from("expenses").select("description, amount, due_date, paid").eq("home_id", data.homeId).eq("paid", false).limit(10),
    ]);

    const context_summary = {
      tarefas_pendentes: (tasksRes.data ?? []).filter((t) => !t.completed).length,
      tarefas_amostra: (tasksRes.data ?? []).slice(0, 5).map((t) => t.title),
      compras_faltando: (shoppingRes.data ?? []).map((s) => s.name).slice(0, 8),
      manutencoes: (maintRes.data ?? []).map((m) => ({ nome: m.name, proxima: m.next_due })),
      contas_a_pagar: (expRes.data ?? []).map((e) => ({ desc: e.description, valor: e.amount, vence: e.due_date })),
    };

    const content = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_INSIGHT },
        { role: "user", content: `Resumo da casa hoje: ${JSON.stringify(context_summary)}\n\nDê UMA sugestão curta e prática.` },
      ],
    });
    return content.trim();
  });

export const chatWithHomeAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        homeId: z.string().uuid(),
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) }))
          .min(1)
          .max(30),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [tasksRes, shoppingRes, maintRes, expRes] = await Promise.all([
      supabase.from("tasks").select("title, completed, category, due_date").eq("home_id", data.homeId).limit(30),
      supabase.from("shopping_items").select("name, category, bought").eq("home_id", data.homeId).limit(30),
      supabase.from("maintenance_items").select("name, last_done, next_due").eq("home_id", data.homeId).limit(20),
      supabase.from("expenses").select("description, amount, category, paid, due_date").eq("home_id", data.homeId).limit(20),
    ]);

    const summary = {
      tarefas: tasksRes.data,
      compras: shoppingRes.data,
      manutencao: maintRes.data,
      contas: expRes.data,
    };

    const { executeHomeTool, HOME_TOOL_SCHEMAS } = await import("../tools/home-tools.server");
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const input: any[] = [
      { role: "system", content: [{ type: "input_text", text: SYSTEM_CHAT }] },
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `Dados atuais da casa (JSON): ${JSON.stringify(summary)}\n` +
              `Hoje é ${new Date().toISOString().slice(0, 10)}. Você PODE executar ações reais ` +
              `usando as ferramentas disponíveis. Ao executar, confirme em uma frase curta o que foi feito.`,
          },
        ],
      },
      ...data.messages.map((m) => ({
        role: m.role,
        content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: m.content }],
      })),
    ];

    const actions: string[] = [];
    let finalText = "";

    for (let step = 0; step < 4; step++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          input,
          tools: HOME_TOOL_SCHEMAS,
          stream: true,
          store: false,
        }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
        if (res.status === 402) throw new Error("Créditos da IA esgotados. Adicione créditos para continuar.");
        throw new Error(`Erro da IA: ${text}`);
      }

      // Consome o SSE: só precisamos do payload final `response.completed`.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed: any = null;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "response.completed") completed = evt.response;
          } catch {
            /* ignora eventos parciais */
          }
        }
      }

      const output: any[] = completed?.output ?? [];
      const calls = output.filter((o) => o.type === "function_call");
      finalText =
        output
          .filter((o) => o.type === "message")
          .flatMap((o: any) => (o.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => c.text))
          .join("\n")
          .trim() || finalText;

      if (calls.length === 0) break;

      input.push(...output);
      for (const call of calls) {
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(call.arguments || "{}");
        } catch {
          args = {};
        }
        const result = await executeHomeTool(call.name, args, {
          supabase,
          homeId: data.homeId,
          userId: context.userId,
        });
        if (result.ok) actions.push(result.message);
        input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
    }

    const text = finalText || actions.join(" ") || "Não consegui gerar uma resposta agora.";
    return { content: text, actions };
  });
