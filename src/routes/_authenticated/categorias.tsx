import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/shared/utils/head";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { EmptyState } from "@/shared/components/EmptyState";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { RoundIconButton } from "@/shared/components/RoundIconButton";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { useCategories, useCategoryMutations } from "@/modules/categories";
import { MODULES, CATEGORY_COLORS } from "@/shared/utils/constants";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Category } from "@/shared/types";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => pageHead({
    title: "Categorias — Casa Hub",
    description: "Crie categorias personalizadas com cores próprias para tarefas, compras e finanças.",
    path: "/categorias",
    noindex: true,
  }),
  component: CategoriesPage,
});

type FormValues = {
  name: string;
  module: string;
  color: string;
};

function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const { data: cats = [] } = useCategories();
  const { create, remove } = useCategoryMutations();

  const grouped = useMemo(
    () =>
      cats.reduce<Record<string, Category[]>>((acc, c) => {
        (acc[c.module] ??= []).push(c);
        return acc;
      }, {}),
    [cats],
  );

  const form = useForm<FormValues>({
    defaultValues: { name: "", module: "tasks", color: CATEGORY_COLORS[0] },
  });
  const selectedModule = form.watch("module");
  const selectedColor = form.watch("color");

  const onSubmit = form.handleSubmit(async (values) => {
    await create.mutateAsync({
      name: values.name.trim(),
      color: values.color,
      module: values.module,
    });
    toast.success("Categoria criada");
    form.reset({ name: "", module: values.module, color: values.color });
    setOpen(false);
  });

  return (
    <AppShell
      subtitle="Personalize sua casa"
      title="Categorias"
      action={<RoundIconButton icon="plus" label="Nova categoria" onClick={() => setOpen(true)} />}
    >
      {cats.length === 0 && (
        <EmptyState message="Crie categorias personalizadas para adaptar cada módulo à rotina da casa." />
      )}

      {MODULES.map((m) => {
        const list = grouped[m.id];
        if (!list?.length) return null;
        return (
          <section key={m.id} className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-sage-800/50">
              {m.label}
            </h2>
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.id}>
                  <CardBlock className="flex items-center gap-3 p-3">
                    <span className="size-6 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1 text-sm font-medium">{c.name}</span>
                    <button onClick={() => remove.mutate(c.id)} aria-label="Excluir categoria" className="text-sage-800/30 hover:text-destructive">
                      <X className="size-4" />
                    </button>
                  </CardBlock>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nova categoria">
        <form onSubmit={onSubmit} className="space-y-3">
          <input autoFocus placeholder="Nome" className={fieldClass()} {...form.register("name", { required: true })} />
          <select className={fieldClass()} {...form.register("module")}>
            {MODULES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <div>
            <label className="text-xs text-sage-800/60">Cor</label>
            <div className="mt-2 flex gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => form.setValue("color", c)}
                  aria-label={`Cor ${c}`}
                  className={`size-8 rounded-full ring-2 ${selectedColor === c ? "ring-sage-800" : "ring-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={!form.watch("name") || create.isPending} className={primaryButtonClass()}>
            {create.isPending ? "Criando..." : "Criar categoria"}
          </button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
