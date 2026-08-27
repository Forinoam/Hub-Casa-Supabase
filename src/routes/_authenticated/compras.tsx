import { createFileRoute } from "@tanstack/react-router";
import { CategoryChip } from "@/shared/components/CategoryChip";
import { pageHead } from "@/shared/utils/head";
import { useMemo, useState } from "react";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { EmptyState } from "@/shared/components/EmptyState";
import { RoundIconButton } from "@/shared/components/RoundIconButton";
import { fieldClass } from "@/shared/components/form-fields";
import { useShoppingItems, useShoppingMutations } from "@/modules/shopping";
import { SHOPPING_CATEGORIES } from "@/shared/utils/constants";
import { useModuleCategories } from "@/modules/categories";
import type { ShoppingItem } from "@/shared/types";
import { toast } from "sonner";
import { X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compras")({
  head: () => pageHead({
    title: "Lista de compras — Casa Hub",
    description: "Lista de compras compartilhada da casa, organizada por categoria e sempre atualizada para todos.",
    path: "/compras",
    noindex: true,
  }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const [name, setName] = useState("");
  const categories = useModuleCategories("shopping", SHOPPING_CATEGORIES);
  const [category, setCategory] = useState("");
  const { data: items = [] } = useShoppingItems();
  const { add, toggle, remove } = useShoppingMutations();

  // Grouping is derived from the same list — memoized so it isn't
  // recomputed on unrelated re-renders (typing in the input).
  const grouped = useMemo(
    () =>
      items.reduce<Record<string, ShoppingItem[]>>((acc, it) => {
        (acc[it.category] ??= []).push(it);
        return acc;
      }, {}),
    [items],
  );

  const handleAdd = async () => {
    if (!name.trim()) return;
    await add.mutateAsync({ name, category: category || categories[0] });
    setName("");
    toast.success("Item salvo");
  };

  return (
    <AppShell subtitle="Lista compartilhada" title="Compras">
      <CardBlock className="mb-6 p-3">
        <div className="flex gap-2">
          <input
            placeholder="Adicionar item..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className={fieldClass("flex-1 py-2.5")}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClass("w-auto py-2.5 text-xs")}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <RoundIconButton icon="plus" label="Adicionar" onClick={handleAdd} />
        </div>
      </CardBlock>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState message="Sua lista está vazia." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat}>
              <h3 className="mb-2 flex items-center text-xs font-semibold uppercase tracking-widest text-sage-800/50">
                <CategoryChip name={cat} module="shopping" className="uppercase tracking-widest" />
              </h3>

              <CardBlock className="p-4">
                <ul className="space-y-3">
                  {list.map((it) => (
                    <li key={it.id} id={`item-${it.id}`} className="flex items-center gap-3">
                      <button
                        onClick={() => toggle.mutate(it)}
                        aria-label={it.bought ? "Desmarcar item" : "Marcar como comprado"}
                        className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                          it.bought ? "border-sage-800 bg-sage-800" : "border-sage-200"
                        }`}
                      >
                        {it.bought && <span className="size-2.5 rounded-sm bg-clay-600" />}
                      </button>
                      <span className={`flex-1 text-sm ${it.bought ? "text-sage-800/40 line-through" : ""}`}>
                        {it.name}
                      </span>
                      <button
                        onClick={() => remove.mutate(it.id)}
                        aria-label="Remover item"
                        className="text-sage-800/30 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardBlock>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
