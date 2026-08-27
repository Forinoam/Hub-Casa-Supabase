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
import { useMemories, useMemoryMutations } from "@/modules/memories";
import { toast } from "sonner";
import { X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/memorias")({
  head: () => pageHead({
    title: "Memórias da casa — Casa Hub",
    description: "O diário da sua casa: registre momentos, reformas e conquistas da vida em família.",
    path: "/memorias",
    noindex: true,
  }),
  component: MemoriesPage,
});

type FormValues = { title: string; content: string };

function MemoriesPage() {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useMemories();
  const { create, remove } = useMemoryMutations();

  const form = useForm<FormValues>({ defaultValues: { title: "", content: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    await create.mutateAsync({ title: values.title.trim(), content: values.content });
    toast.success("Memória salva");
    form.reset();
    setOpen(false);
  });

  return (
    <AppShell
      subtitle="Diário da casa"
      title="Memórias"
      action={<RoundIconButton icon="plus" label="Nova memória" onClick={() => setOpen(true)} />}
    >
      {items.length === 0 ? (
        <EmptyState message="Registre reformas, primeiras vezes e momentos especiais." />
      ) : (
        <ul className="space-y-4">
          {items.map((m) => (
            <li key={m.id}>
              <CardBlock className="p-5">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-sage-800/50">
                    {new Date(m.date + "T00:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button onClick={() => remove.mutate(m.id)} aria-label="Remover memória" className="text-sage-800/30 hover:text-destructive">
                    <X className="size-4" />
                  </button>
                </div>
                <h3 className="mt-1 text-base font-semibold">{m.title}</h3>
                {m.content && (
                  <p className="mt-2 whitespace-pre-line text-sm text-sage-800/70">{m.content}</p>
                )}
              </CardBlock>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nova memória">
        <form onSubmit={onSubmit} className="space-y-3">
          <input placeholder='Ex: "Pintamos a sala hoje"' className={fieldClass()} {...form.register("title", { required: true })} />
          <textarea rows={4} placeholder="Conte um pouco..." className={fieldClass()} {...form.register("content")} />
          <button type="submit" disabled={!form.watch("title") || create.isPending} className={primaryButtonClass()}>
            {create.isPending ? "Salvando..." : "Registrar"}
          </button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
