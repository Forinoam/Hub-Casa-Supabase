import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Trash2, Crown, Copy, X } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { EmptyState } from "@/shared/components/EmptyState";
import { roleLabel } from "@/shared/components/HomeMenu";
import { useHomeContext } from "@/shared/context/HomeContext";
import { useHomeMembers } from "@/shared/hooks/useHomeMembers";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import {
  invitesService,
  useInvites,
  removeMember,
  transferOwnership,
  updateMemberRole,
} from "@/modules/family";
import { reportError } from "@/shared/utils/errors";
import { emit } from "@/automation/bus";
import { qk } from "@/shared/utils/query-keys";
import { formatDate } from "@/shared/utils/format";

export const Route = createFileRoute("/_authenticated/familia")({
  head: () => pageHead({
    title: "Moradores da casa — Casa Hub",
    description: "Convide moradores, defina papéis e gerencie quem participa da sua casa.",
    path: "/familia",
    noindex: true,
  }),
  component: FamilyPage,
});

type InviteValues = { email: string; role: "member" | "admin" };

function FamilyPage() {
  const { home, homeId, isAdmin, isOwner, refresh } = useHomeContext();
  const { members } = useHomeMembers();
  const { data: user } = useAuthUser();
  const { data: invites = [] } = useInvites();
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const form = useForm<InviteValues>({ defaultValues: { email: "", role: "member" } });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: qk.members.all });
    await qc.invalidateQueries({ queryKey: qk.invites.all });
    await refresh();
  };

  const invite = useMutation({
    mutationFn: (v: InviteValues) => invitesService.createInvite(homeId!, v.email, v.role),
    onSuccess: async (inv) => {
      emit({ type: "invite.created", homeId: inv.home_id, inviteId: inv.id, email: inv.email });
      form.reset({ email: "", role: "member" });
      setShowInvite(false);
      await invalidate();
      toast.success(`Convite criado. Código: ${inv.code}`);
    },
    onError: (e) => reportError("Convite", e, "Não consegui criar o convite."),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => invitesService.revokeInvite(id),
    onSuccess: async (_d, id) => {
      emit({ type: "invite.revoked", homeId: homeId!, inviteId: id });
      await invalidate();
      toast.success("Convite cancelado");
    },
    onError: (e) => reportError("Convite", e),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeMember(homeId!, userId),
    onSuccess: async (_d, userId) => {
      emit({ type: "member.left", homeId: homeId!, userId });
      await invalidate();
      toast.success("Morador removido");
    },
    onError: (e) => reportError("Família", e),
  });

  const changeRole = useMutation({
    mutationFn: (p: { userId: string; role: "admin" | "member" }) =>
      updateMemberRole(homeId!, p.userId, p.role),
    onSuccess: async (_d, p) => {
      emit({ type: "member.roleChanged", homeId: homeId!, userId: p.userId, role: p.role });
      await invalidate();
      toast.success("Papel atualizado");
    },
    onError: (e) => reportError("Família", e),
  });

  const transfer = useMutation({
    mutationFn: (userId: string) => transferOwnership(homeId!, user!.id, userId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Propriedade transferida");
    },
    onError: (e) => reportError("Família", e),
  });

  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <AppShell
      subtitle="Moradores"
      title={home?.home_name ?? "Família"}
      action={
        isAdmin ? (
          <button
            onClick={() => setShowInvite(true)}
            className="grid size-10 place-items-center rounded-full bg-sage-800 text-white"
            aria-label="Convidar morador"
          >
            <UserPlus className="size-4" />
          </button>
        ) : null
      }
    >
      <ul className="mb-6 space-y-3">
        {members.map((m) => {
          const isSelf = m.user_id === user?.id;
          return (
            <li key={m.user_id}>
              <CardBlock className="flex items-center gap-3 p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-100 text-sm font-bold">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {m.name} {isSelf && <span className="text-sage-800/40">(você)</span>}
                  </p>
                  <p className="text-xs text-sage-800/60">
                    {roleLabel(m.role)}
                    {m.joined_at ? ` · desde ${formatDate(m.joined_at)}` : ""}
                  </p>
                </div>
                {isAdmin && !isSelf && (
                  <div className="flex shrink-0 items-center gap-1">
                    {m.role !== "owner" && (
                      <button
                        aria-label="Alternar administrador"
                        onClick={() =>
                          changeRole.mutate({
                            userId: m.user_id,
                            role: m.role === "admin" ? "member" : "admin",
                          })
                        }
                        className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sage-800/60 ring-1 ring-black/5"
                      >
                        {m.role === "admin" ? "Tornar membro" : "Tornar admin"}
                      </button>
                    )}
                    {isOwner && m.role !== "owner" && (
                      <button
                        aria-label="Transferir propriedade"
                        onClick={() => transfer.mutate(m.user_id)}
                        className="grid size-8 place-items-center rounded-full text-sage-800/50"
                      >
                        <Crown className="size-4" />
                      </button>
                    )}
                    {m.role !== "owner" && (
                      <button
                        aria-label="Remover morador"
                        onClick={() => remove.mutate(m.user_id)}
                        className="grid size-8 place-items-center rounded-full text-clay-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                )}
              </CardBlock>
            </li>
          );
        })}
      </ul>

      {isAdmin && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs uppercase tracking-widest text-sage-800/40">
            Convites pendentes
          </h2>
          {pendingInvites.length === 0 ? (
            <EmptyState message="Nenhum convite pendente. Convide alguém para cuidar da casa com você." />
          ) : (
            <ul className="space-y-2">
              {pendingInvites.map((inv) => (
                <li key={inv.id}>
                  <CardBlock className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-sage-800/60">
                        Código <span className="font-mono font-semibold">{inv.code}</span> ·{" "}
                        {roleLabel(inv.role)}
                      </p>
                    </div>
                    <button
                      aria-label="Copiar código"
                      onClick={() => {
                        navigator.clipboard?.writeText(inv.code);
                        toast.success("Código copiado");
                      }}
                      className="grid size-8 place-items-center rounded-full text-sage-800/60"
                    >
                      <Copy className="size-4" />
                    </button>
                    <button
                      aria-label="Cancelar convite"
                      onClick={() => revoke.mutate(inv.id)}
                      className="grid size-8 place-items-center rounded-full text-clay-600"
                    >
                      <X className="size-4" />
                    </button>
                  </CardBlock>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <BottomSheet
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Convidar morador"
      >
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((v) => invite.mutate(v))}
        >
          <input
            type="email"
            placeholder="email@exemplo.com"
            className={fieldClass()}
            {...form.register("email", { required: true })}
          />
          <select className={fieldClass()} {...form.register("role")}>
            <option value="member">Membro</option>
            <option value="admin">Administrador</option>
          </select>
          <p className="text-xs text-sage-800/60">
            Um código será gerado. A pessoa entra na casa informando esse código na tela de
            convites.
          </p>
          <button type="submit" disabled={invite.isPending} className={primaryButtonClass()}>
            {invite.isPending ? "Gerando..." : "Gerar convite"}
          </button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
