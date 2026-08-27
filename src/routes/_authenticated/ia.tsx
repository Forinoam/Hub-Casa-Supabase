import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { useHome } from "@/shared/hooks/useHome";
import { useDashboardSummary } from "@/modules/dashboard";
import { chatWithHomeAI } from "@/modules/ai";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ia")({
  head: () => pageHead({
    title: "IA da Casa — Casa Hub",
    description: "Converse com a assistente da casa: ela entende o contexto e executa ações por você.",
    path: "/ia",
    noindex: true,
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    auto: search.auto === true || search.auto === "true" ? true : undefined,
  }),
  component: AIPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Como está a casa?",
  "O que precisamos comprar?",
  "Quais contas vencem essa semana?",
  "Quem fez mais tarefas esse mês?",
];

function AIPage() {
  const { auto } = Route.useSearch();
  const { data: home } = useHome();
  const homeId = home?.home_id;
  const summary = useDashboardSummary();

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou a **IA da Casa**. Posso te ajudar a organizar tarefas, compras, manutenção e finanças. O que você quer saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  /** Snapshot do dashboard enviado junto da pergunta para respostas concretas. */
  const context = useMemo(() => {
    const { house, indicators, finance, priorities } = summary;
    const lines = [
      `Índice da casa: ${house.score}/100.`,
      `Tarefas pendentes: ${indicators.pendingTasks} (${indicators.overdueTasks} atrasadas).`,
      `Compras pendentes: ${indicators.pendingShopping}.`,
      `Contas vencidas: ${indicators.overdueBills}. Saldo do mês: R$ ${finance.balance.toFixed(2)}.`,
      `Compromissos futuros: ${indicators.upcomingEvents}.`,
      priorities.length
        ? `Prioridades de hoje: ${priorities.map((p) => `${p.label} (${p.detail})`).join("; ")}.`
        : "Nenhuma prioridade crítica hoje.",
    ];
    return lines.join("\n");
  }, [summary]);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  const send = async (text: string, history?: Msg[]) => {
    if (!homeId || !text.trim() || loading) return;
    const base = history ?? messages;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...base, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await chatWithHomeAI({
        data: {
          homeId,
          messages: [
            { role: "user" as const, content: `Contexto atual da casa:\n${context}` },
            ...next,
          ],
        },
      });
      setMessages([
        ...next,
        {
          role: "assistant",
          content: reply.actions.length > 0
            ? `${reply.content}\n\n✅ ${reply.actions.join("\n✅ ")}`
            : reply.content,
        },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao falar com a IA");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  // Entrada vinda do card de sugestão do Dashboard: já abre analisando a casa.
  useEffect(() => {
    if (!auto || autoSent.current || !homeId || summary.isLoading) return;
    autoSent.current = true;
    void send("Analise a situação da casa agora e me diga o que devo priorizar hoje.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, homeId, summary.isLoading]);

  return (
    <AppShell subtitle="Assistente inteligente" title="IA da Casa">
      <div className="space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" ? (
              <CardBlock variant="dark" className="max-w-[85%] px-5 py-4">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="size-3 text-clay-600" />
                  <span className="text-[10px] font-medium uppercase tracking-widest opacity-70">
                    IA da Casa
                  </span>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </CardBlock>
            ) : (
              <div className="max-w-[85%] rounded-3xl rounded-br-md bg-clay-600 px-5 py-3 text-sm text-white">
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <CardBlock variant="dark" className="px-5 py-4">
              <div className="flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-sage-50 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-sage-50 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-sage-50 [animation-delay:300ms]" />
              </div>
            </CardBlock>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && !loading && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-sage-800 ring-1 ring-black/5"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="fixed inset-x-4 bottom-6 mx-auto max-w-[calc(56ch-2rem)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-3xl bg-white p-2 shadow-lg ring-1 ring-black/5"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            placeholder="Pergunte algo sobre a casa..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-800 text-sage-50 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
