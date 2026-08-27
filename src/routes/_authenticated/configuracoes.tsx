import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { useHomeContext } from "@/shared/context/HomeContext";
import { renameHome, removeMember, updateHomeSettings, type HomeSettings } from "@/modules/family";
import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/shared/utils/errors";
import { emit } from "@/automation/bus";
import { roleLabel } from "@/shared/components/HomeMenu";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { PushNotificationsCard } from "@/modules/notifications/components/PushNotificationsCard";
import { NotificationPreferencesCard } from "@/modules/notifications/components/NotificationPreferencesCard";
import { NotificationHistoryCard } from "@/modules/notifications/components/NotificationHistoryCard";


export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => pageHead({
    title: "Configurações da casa — Casa Hub",
    description: "Ajuste nome, automações e notificações da sua casa no Casa Hub.",
    path: "/configuracoes",
    noindex: true,
  }),
  component: HomeSettingsPage,
});

const TOGGLES: { key: keyof HomeSettings; label: string; hint: string }[] = [
  {
    key: "confirmAutomations",
    label: "Confirmar antes de automatizar",
    hint: "Pede sua confirmação antes de criar despesas ou tarefas automáticas.",
  },
  {
    key: "smartSuggestions",
    label: "Sugestões inteligentes",
    hint: "Permite que o motor de insights sugira ações no dashboard.",
  },
  {
    key: "autoHouseIndex",
    label: "Índice da Casa em tempo real",
    hint: "Recalcula o índice sempre que algo muda na casa.",
  },
];

function HomeSettingsPage() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const { home, homeId, settings, isAdmin, isOwner, refresh } = useHomeContext();
  const [name, setName] = useState(home?.home_name ?? "");
  const [local, setLocal] = useState<HomeSettings>(settings);

  useEffect(() => setName(home?.home_name ?? ""), [home?.home_name]);
  useEffect(() => setLocal(settings), [settings]);

  const saveName = useMutation({
    mutationFn: () => renameHome(homeId!, name.trim()),
    onSuccess: async () => {
      emit({ type: "home.updated", homeId: homeId!, name: name.trim() });
      await refresh();
      toast.success("Nome da casa atualizado");
    },
    onError: (e) => reportError("Casa", e),
  });

  const saveSettings = useMutation({
    mutationFn: (next: HomeSettings) => updateHomeSettings(homeId!, next),
    onSuccess: async (_d, next) => {
      emit({ type: "home.settingsUpdated", homeId: homeId! });
      await refresh();
      toast.success("Configurações salvas");
    },
    onError: (e) => reportError("Casa", e),
  });

  const toggle = (key: keyof HomeSettings) => {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    saveSettings.mutate(next);
  };

  const leaveHome = useMutation({
    mutationFn: () => removeMember(homeId!, user!.id),
    onSuccess: async () => {
      emit({ type: "member.left", homeId: homeId!, userId: user!.id });
      await refresh();
      toast.success("Você saiu da casa");
      navigate({ to: "/onboarding" });
    },
    onError: (e) => reportError("Casa", e, "Não foi possível sair desta casa."),
  });

  const handleLeaveHome = () => {
    if (!homeId || !user?.id) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja sair desta casa? Esta ação não poderá ser desfeita.",
    );
    if (!confirmed) return;
    leaveHome.mutate();
  };

  const deleteHome = useMutation({
    mutationFn: async () => {
      if (!homeId) throw new Error("Casa não encontrada.");
      const { error } = await supabase.from("homes").delete().eq("id", homeId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Casa excluída permanentemente");
      navigate({ to: "/onboarding" });
    },
    onError: (e) => reportError("Casa", e, "Não foi possível excluir esta casa."),
  });

  const handleDeleteHome = () => {
    if (!homeId) return;
    const firstConfirm = window.confirm(
      "Esta ação excluirá permanentemente a casa e todos os dados relacionados. Deseja continuar?",
    );
    if (!firstConfirm) return;
    const secondConfirm = window.confirm(
      "Confirmação final: excluir definitivamente esta casa? Esta ação não pode ser desfeita.",
    );
    if (!secondConfirm) return;
    deleteHome.mutate();
  };

  return (
    <AppShell subtitle="Configurações" title={home?.home_name ?? "Minha casa"}>
      <div className="space-y-4">
        <CardBlock>
          <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">Identidade</p>
          <input
            className={fieldClass()}
            value={name}
            disabled={!isAdmin}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da casa"
          />
          {isAdmin && (
            <button
              className={`${primaryButtonClass()} mt-3`}
              disabled={saveName.isPending || !name.trim() || name === home?.home_name}
              onClick={() => saveName.mutate()}
            >
              {saveName.isPending ? "Salvando..." : "Salvar nome"}
            </button>
          )}
          <p className="mt-3 text-xs text-sage-800/60">
            Seu papel nesta casa: <strong>{home ? roleLabel(home.role) : "—"}</strong>
          </p>
        </CardBlock>

        <CardBlock>
          <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">
            Automações da casa
          </p>
          <ul className="space-y-3">
            {TOGGLES.map((t) => (
              <li key={t.key} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-sage-800/60">{t.hint}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={local[t.key]}
                  aria-label={t.label}
                  disabled={!isAdmin}
                  onClick={() => toggle(t.key)}
                  className={`mt-1 h-6 w-11 shrink-0 rounded-full transition ${
                    local[t.key] ? "bg-sage-800" : "bg-sage-200"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`block size-5 rounded-full bg-white transition ${
                      local[t.key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          {!isAdmin && (
            <p className="mt-4 text-xs text-sage-800/50">
              Apenas administradores podem alterar as configurações desta casa.
            </p>
          )}
        </CardBlock>

        <PushNotificationsCard />

        <NotificationPreferencesCard />

        <NotificationHistoryCard />


        <CardBlock>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-9 place-items-center rounded-full bg-clay-100 text-clay-700">
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-semibold text-clay-700">Zona de perigo</p>
              <p className="text-sm text-sage-800/70">
                Membros podem sair da casa. Apenas o proprietário pode excluir definitivamente todos os dados da casa.
              </p>
              <button
                type="button"
                onClick={handleLeaveHome}
                disabled={leaveHome.isPending || isOwner}
                className="mt-3 rounded-full bg-clay-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {leaveHome.isPending ? "Saindo..." : "Sair desta casa"}
              </button>
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={handleDeleteHome}
                    disabled={deleteHome.isPending}
                    className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleteHome.isPending ? "Excluindo..." : "Excluir casa definitivamente"}
                  </button>
                  <p className="mt-2 text-xs text-sage-800/50">
                    Esta ação remove a casa e todos os registros vinculados de forma permanente.
                  </p>
                </>
              )}
            </div>
          </div>
        </CardBlock>
      </div>
    </AppShell>
  );
}
