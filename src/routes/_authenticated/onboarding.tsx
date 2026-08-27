import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Home, Ticket } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { createNewHome, invitesService, useMyInvites } from "@/modules/family";
import { useHomeContext } from "@/shared/context/HomeContext";
import { reportError } from "@/shared/utils/errors";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { emit } from "@/automation/bus";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => pageHead({
    title: "Criar ou entrar em uma casa — Casa Hub",
    description: "Crie sua casa ou aceite um convite para começar a organizar a rotina no Casa Hub.",
    path: "/onboarding",
    noindex: true,
  }),
  component: OnboardingPage,
});

type CreateValues = { homeName: string };
type JoinValues = { code: string };

function OnboardingPage() {
  const navigate = useNavigate();
  const { refresh, switchHome, hasHome } = useHomeContext();
  const [tab, setTab] = useState<"create" | "join">("create");
  const { data: myInvites = [] } = useMyInvites();

  const createForm = useForm<CreateValues>({ defaultValues: { homeName: "Minha casa" } });
  const joinForm = useForm<JoinValues>({ defaultValues: { code: "" } });

  const enterHome = async (homeId: string) => {
    await refresh();
    await switchHome(homeId);
    navigate({ to: "/" });
  };

  const create = useMutation({
    mutationFn: (name: string) => createNewHome(name),
    onSuccess: async (home) => {
      emit({
        type: "home.created",
        homeId: home.home_id,
        name: home.home_name,
        createdBy: home.created_by,
      });
      toast.success(`Você entrou em ${home.home_name}`);
      await enterHome(home.home_id);
    },
    onError: (e) => reportError("Casa", e, "Não consegui criar sua casa."),
  });

  const join = useMutation({
    mutationFn: (code: string) => invitesService.acceptInvite(code),
    onSuccess: async (homeId) => {
      emit({ type: "invite.accepted", homeId, userId: "" });
      toast.success("Convite aceito! Bem-vindo à casa.");
      await enterHome(homeId);
    },
    onError: (e) => reportError("Convite", e, "Não consegui aceitar o convite."),
  });

  return (
    <AppShell subtitle={hasHome ? "Outra casa" : "Bem-vindo"} title="Casa Hub">
      <div className="mb-5 flex rounded-full bg-sage-100 p-1">
        <TabButton active={tab === "create"} onClick={() => setTab("create")}>
          Criar casa
        </TabButton>
        <TabButton active={tab === "join"} onClick={() => setTab("join")}>
          Tenho convite
        </TabButton>
      </div>

      {tab === "create" ? (
        <CardBlock>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Home className="size-4" /> Criar uma nova casa
          </div>
          <p className="mb-4 text-sm text-sage-800/70">
            Você será o proprietário e poderá convidar moradores depois.
          </p>
          <form
            className="space-y-3"
            onSubmit={createForm.handleSubmit((v) => create.mutate(v.homeName.trim()))}
          >
            <input
              type="text"
              placeholder="Ex: Apartamento 501"
              className={fieldClass()}
              autoFocus
              {...createForm.register("homeName", { required: true, minLength: 1 })}
            />
            <button type="submit" disabled={create.isPending} className={primaryButtonClass()}>
              {create.isPending ? "Criando..." : "Criar minha casa"}
            </button>
          </form>
        </CardBlock>
      ) : (
        <CardBlock>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Ticket className="size-4" /> Entrar com convite
          </div>
          <p className="mb-4 text-sm text-sage-800/70">
            Digite o código que o administrador da casa enviou para você.
          </p>
          <form
            className="space-y-3"
            onSubmit={joinForm.handleSubmit((v) => join.mutate(v.code))}
          >
            <input
              type="text"
              placeholder="Ex: A1B2C3D4"
              className={`${fieldClass()} uppercase tracking-widest`}
              {...joinForm.register("code", { required: true, minLength: 4 })}
            />
            <button type="submit" disabled={join.isPending} className={primaryButtonClass()}>
              {join.isPending ? "Entrando..." : "Aceitar convite"}
            </button>
          </form>

          {myInvites.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs uppercase tracking-widest text-sage-800/40">
                Convites para você
              </p>
              {myInvites.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => join.mutate(inv.code)}
                  className="flex w-full items-center justify-between rounded-2xl bg-sage-50 px-4 py-3 text-left text-sm"
                >
                  <span className="font-medium">{inv.home_name}</span>
                  <span className="text-xs text-sage-800/60">Aceitar ›</span>
                </button>
              ))}
            </div>
          )}
        </CardBlock>
      )}
    </AppShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition ${
        active ? "bg-white text-sage-800 shadow-sm" : "text-sage-800/50"
      }`}
    >
      {children}
    </button>
  );
}
