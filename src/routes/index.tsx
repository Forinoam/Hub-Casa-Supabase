import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Home, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { useHome } from "@/shared/hooks/useHome";
import { useProfile } from "@/shared/hooks/useProfile";
import { useDashboardSummary } from "@/modules/dashboard";
import { HeroCard } from "@/modules/dashboard/components/HeroCard";
import { PrioritiesSection } from "@/modules/dashboard/components/PrioritiesSection";
import { TimelineSection } from "@/modules/dashboard/components/TimelineSection";
import { QuickActions } from "@/modules/dashboard/components/QuickActions";
import { SuggestionCard } from "@/modules/dashboard/components/SuggestionCard";
import { MemoryFlashback } from "@/modules/dashboard/components/MemoryFlashback";
import { MonthPulseCard } from "@/modules/dashboard/components/MonthPulseCard";
import { ExploreSection } from "@/modules/dashboard/components/ExploreSection";
import { getCurrentHome } from "@/modules/family";

export const Route = createFileRoute("/")({
  head: () => pageHead({
    title: "Casa Hub — o painel da sua casa",
    description: "Veja num só lugar como está sua casa hoje: prioridades, contas, compras, agenda e manutenção com sugestões inteligentes.",
    path: "/",
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
  },
  component: HomeRoute,
});

function buildHeadline(criticalCount: number, prioritiesCount: number, score: number) {
  if (criticalCount > 0) return "Existem pontos que precisam da sua atenção agora.";
  if (prioritiesCount > 0) return "Alguns detalhes esperam por você hoje.";
  if (score >= 90) return "Parabéns! Todas as tarefas importantes estão em dia.";
  return "Hoje sua casa está tranquila e organizada.";
}

function HomeRoute() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    const resolveRoute = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      setIsAuthenticated(true);
      try {
        const home = await getCurrentHome();
        if (!home) {
          navigate({ to: "/onboarding" });
          return;
        }
        navigate({ to: "/" });
      } catch {
        navigate({ to: "/onboarding" });
      } finally {
        if (active) setIsChecking(false);
      }
    };

    void resolveRoute();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        void resolveRoute();
      }
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-paper px-6 py-16">
        <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-sage-800 text-sage-50">
            <Home className="size-5" />
          </div>
          <p className="text-sm text-sage-800/60">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <WelcomePage />;
}

function WelcomePage() {
  const navigate = useNavigate();

  const features = useMemo(
    () => [
      { title: "Organize sua rotina", detail: "Tarefas, compras e manutenção em um só lugar." },
      { title: "Acompanhe a casa", detail: "Dashboard com prioridade, finanças e hábitos compartilhados." },
      { title: "Mantenha a família em sincronia", detail: "Convites, papéis e atualizações sem complicação." },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-paper px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl flex-1">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-sm font-medium text-sage-800/80">
            <Sparkles className="size-4" /> Casa OS
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-sage-800 sm:text-5xl">
            Organize a sua casa com calma, clareza e carinho.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-sage-800/70">
            Centralize tarefas, compras, finanças e rotina da família em uma experiência simples e acolhedora para todos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate({ to: "/auth" })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-800 px-5 py-3 text-sm font-medium text-sage-50 transition active:scale-[0.98]"
            >
              Iniciar sessão <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-sage-800/60">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-black/5">
              <CheckCircle2 className="size-4 text-sage-800" /> Planejamento simples
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-black/5">
              <ShieldCheck className="size-4 text-sage-800" /> Compartilhado com a família
            </span>
          </div>
        </div>

        <div className="w-full max-w-xl space-y-4">
          {features.map((feature) => (
            <CardBlock key={feature.title} className="flex items-start gap-3">
              <div className="mt-0.5 grid size-10 place-items-center rounded-2xl bg-sage-100 text-sage-800">
                <Home className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-sage-800">{feature.title}</h2>
                <p className="mt-1 text-sm text-sage-800/70">{feature.detail}</p>
              </div>
            </CardBlock>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: home } = useHome();
  const name = profile?.display_name?.split(" ")[0] ?? "por aí";

  const {
    priorities, timeline, house, indicators, finance,
    nextMaintenance, flashback, suggestion,
  } = useDashboardSummary();

  const criticalCount = priorities.filter((p) => p.severity === 3).length;
  const headline = buildHeadline(criticalCount, priorities.length, house.score);

  return (
    <AppShell>
      <div className="space-y-6">
        <HeroCard
          name={name}
          house={house}
          headline={headline}
          criticalCount={criticalCount}
          areas={{
            overdueTasks: indicators.overdueTasks,
            pendingTasks: indicators.pendingTasks,
            pendingShopping: indicators.pendingShopping,
            overdueBills: indicators.overdueBills,
            maintenanceDue: !!nextMaintenance,
            upcomingEvents: indicators.upcomingEvents,
          }}
        />

        <SuggestionCard message={suggestion} />

        <div id="prioridades" className="scroll-mt-24">
          <PrioritiesSection items={priorities} />
        </div>

        <QuickActions />

        <TimelineSection entries={timeline} />

        <MonthPulseCard
          income={finance.monthlyIncome}
          spent={finance.monthlyPaid}
          pendingBills={finance.monthlyExpenses}
          pendingBillsCount={finance.pendingBillsCount}
        />

        <ExploreSection />

        <MemoryFlashback memory={flashback} />

        <div className="pt-2 text-center">
          <Link to="/familia" className="text-xs font-medium text-sage-800/40">
            Família de {home?.home_name ?? "Minha casa"}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

