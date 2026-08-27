import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { EmptyState } from "@/shared/components/EmptyState";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { RoundIconButton } from "@/shared/components/RoundIconButton";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { useMaintenance, useMaintenanceMutations } from "@/modules/maintenance";
import { formatDate } from "@/shared/utils/format";
import { toast } from "sonner";
import { Wrench, X, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manutencao")({
  head: () => pageHead({
    title: "Manutenção preventiva — Casa Hub",
    description: "Acompanhe manutenções da casa com histórico, próxima data prevista e responsáveis.",
    path: "/manutencao",
    noindex: true,
  }),
  component: MaintenancePage,
});

type FormValues = { name: string; last_done: string; next_due: string };

function MaintenancePage() {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useMaintenance();
  const { create, remove } = useMaintenanceMutations();

  const form = useForm<FormValues>({ defaultValues: { name: "", last_done: "", next_due: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    await create.mutateAsync({
      name: values.name.trim(),
      last_done: values.last_done || null,
      next_due: values.next_due || null,
    });
    toast.success("Manutenção salva");
    form.reset();
    setOpen(false);
  });

  return (
    <AppShell
      subtitle="Cuidados da casa"
      title="Manutenção"
      action={<RoundIconButton icon="plus" label="Nova manutenção" onClick={() => setOpen(true)} />}
    >
      {items.length === 0 ? (
        <EmptyState message="Adicione filtros, revisões e cuidados preventivos." />
      ) : (
        <ul className="space-y-3">
          {items.map((m) => {
            const overdue = m.next_due && new Date(m.next_due) < new Date(new Date().toDateString());
            return (
              <li key={m.id}>
                <CardBlock className="flex items-center gap-4 p-4">
                  <div
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                      overdue ? "bg-clay-600/10 text-clay-600" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <Wrench className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      <button
                        onClick={() => remove.mutate(m.id)}
                        aria-label="Remover manutenção"
                        className="ml-auto text-sage-800/30 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="inline-flex items-center gap-1 text-xs text-sage-800/60">
                      {m.next_due && <Bell className="size-3" aria-label="Gera lembrete" />}
                      {m.next_due ? `Próxima: ${formatDate(m.next_due)}` : "Sem data definida"}
                      {m.last_done && ` • Última: ${formatDate(m.last_done)}`}
                    </p>
                  </div>
                </CardBlock>
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nova manutenção">
        <form onSubmit={onSubmit} className="space-y-3">
          <input autoFocus placeholder="Ex: Trocar filtro do ar" className={fieldClass()} {...form.register("name", { required: true })} />
          <label className="block text-xs text-sage-800/60">Última manutenção</label>
          <input type="date" className={fieldClass()} {...form.register("last_done")} />
          <label className="block text-xs text-sage-800/60">Próxima</label>
          <input type="date" className={fieldClass()} {...form.register("next_due")} />
          <button type="submit" disabled={!form.watch("name") || create.isPending} className={primaryButtonClass()}>
            {create.isPending ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
