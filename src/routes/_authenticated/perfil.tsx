import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, LogOut, DoorOpen } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { useProfile } from "@/shared/hooks/useProfile";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { useHomeContext } from "@/shared/context/HomeContext";
import { removeMember } from "@/modules/family";
import { roleLabel } from "@/shared/components/HomeMenu";
import { supabase } from "@/integrations/supabase/client";
import { signOut as signOutService } from "@/shared/services/auth.service";
import { reportError } from "@/shared/utils/errors";
import { qk } from "@/shared/utils/query-keys";
import { emit } from "@/automation/bus";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => pageHead({
    title: "Meu perfil — Casa Hub",
    description: "Atualize seu nome, foto e preferências pessoais no Casa Hub.",
    path: "/perfil",
    noindex: true,
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: user } = useAuthUser();
  const { home, homes, switchHome, refresh } = useHomeContext();
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => setName(profile?.display_name ?? ""), [profile?.display_name]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.profile.all });
      await qc.invalidateQueries({ queryKey: qk.members.all });
      toast.success("Perfil atualizado");
    },
    onError: (e) => reportError("Perfil", e),
  });

  const leave = useMutation({
    mutationFn: (homeId: string) => removeMember(homeId, user!.id),
    onSuccess: async (_d, homeId) => {
      emit({ type: "member.left", homeId, userId: user!.id });
      await refresh();
      toast.success("Você saiu da casa");
      navigate({ to: "/" });
    },
    onError: (e) => reportError("Casa", e, "Proprietários precisam transferir a casa antes de sair."),
  });

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await signOutService();
    navigate({ to: "/", replace: true });
  };

  return (
    <AppShell subtitle="Conta" title="Meu perfil">
      <div className="space-y-4">
        <CardBlock>
          <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">Seus dados</p>
          <input
            className={fieldClass()}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como quer ser chamado?"
          />
          <p className="mt-2 text-xs text-sage-800/60">{user?.email}</p>
          <button
            className={`${primaryButtonClass()} mt-3`}
            disabled={save.isPending || !name.trim() || name === profile?.display_name}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Salvando..." : "Salvar"}
          </button>
        </CardBlock>

        <CardBlock>
          <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">Minhas casas</p>
          <ul className="space-y-2">
            {homes.map((h) => {
              const active = h.home_id === home?.home_id;
              return (
                <li
                  key={h.home_id}
                  className="flex items-center gap-3 rounded-2xl bg-sage-50 px-4 py-3"
                >
                  <button
                    onClick={() => switchHome(h.home_id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium">{h.home_name}</p>
                    <p className="text-xs text-sage-800/60">{roleLabel(h.role)}</p>
                  </button>
                  {active && <Check className="size-4 shrink-0 text-sage-800" />}
                  {h.role !== "owner" && (
                    <button
                      aria-label={`Sair de ${h.home_name}`}
                      onClick={() => leave.mutate(h.home_id)}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-clay-600"
                    >
                      <DoorOpen className="size-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </CardBlock>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-clay-600 ring-1 ring-black/5"
        >
          <LogOut className="size-4" /> Sair da conta
        </button>
      </div>
    </AppShell>
  );
}
