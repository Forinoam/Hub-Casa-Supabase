import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

/** Only same-origin relative paths are honored as post-login destinations. */
function safeNext(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

export const Route = createFileRoute("/auth")({
  head: () => pageHead({
    title: "Entrar no Casa Hub",
    description: "Acesse sua casa no Casa Hub para organizar tarefas, compras, finanças e agenda com quem mora com você.",
    path: "/auth",
  }),
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = safeNext(search.next);
    return next ? { next } : {};
  },
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      if (search.next) throw redirect({ href: search.next });
      throw redirect({ to: "/" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN") return;
      if (next) window.location.replace(next);
      else navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: next ? window.location.origin + next : window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo à sua Casa OS.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: next ? window.location.origin + next : window.location.origin,
    });
    if (result.error) {
      toast.error("Erro ao entrar com Google");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-paper px-6 pt-16 pb-12">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-3xl bg-sage-800 text-sage-50 text-2xl font-semibold">
            🏠
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Casa OS</h1>
          <p className="mt-1 text-sm text-sage-800/60">
            O sistema operacional da sua casa
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 ring-1 ring-black/5">
          <div className="mb-5 flex rounded-full bg-sage-100 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition ${
                mode === "signin" ? "bg-white text-sage-800 shadow-sm" : "text-sage-800/50"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition ${
                mode === "signup" ? "bg-white text-sage-800 shadow-sm" : "text-sage-800/50"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl bg-sage-50 px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-sage-800"
              />
            )}
            <input
              type="email"
              required
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl bg-sage-50 px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-sage-800"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl bg-sage-50 px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-sage-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-sage-800 py-3 text-sm font-medium text-sage-50 transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Carregando..." : mode === "signin" ? "Entrar" : "Criar minha casa"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-sage-200" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-sage-800/40">
              ou
            </span>
            <div className="h-px flex-1 bg-sage-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-medium text-sage-800 ring-1 ring-sage-200 transition active:scale-[0.98]"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Continuar com Google
          </button>
        </div>
      </div>
    </div>
  );
}
