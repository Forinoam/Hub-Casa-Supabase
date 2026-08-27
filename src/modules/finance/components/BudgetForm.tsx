import { useForm } from "react-hook-form";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { useModuleCategories } from "@/modules/categories/hooks/useModuleCategories";
import { EXPENSE_CATEGORIES } from "@/shared/utils/constants";

export type BudgetFormValues = { category: string; amount: string };

export function BudgetForm({
  onSubmit,
  pending,
  initial,
}: {
  onSubmit: (values: BudgetFormValues) => Promise<void>;
  pending: boolean;
  initial?: { category: string; amount: number } | null;
}) {
  const categories = useModuleCategories("expenses", EXPENSE_CATEGORIES as unknown as string[]);
  const { register, handleSubmit, watch, reset } = useForm<BudgetFormValues>({
    defaultValues: {
      category: initial?.category ?? categories[0] ?? "",
      amount: initial ? String(initial.amount) : "",
    },
  });

  const submit = handleSubmit(async (v) => {
    await onSubmit(v);
    reset({ category: v.category, amount: "" });
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <select className={fieldClass()} {...register("category", { required: true })}>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.01"
        placeholder="Limite mensal R$"
        className={fieldClass()}
        {...register("amount", { required: true, min: 0 })}
      />
      <button type="submit" disabled={!watch("amount") || pending} className={primaryButtonClass()}>
        {pending ? "Salvando..." : "Salvar orçamento"}
      </button>
    </form>
  );
}
