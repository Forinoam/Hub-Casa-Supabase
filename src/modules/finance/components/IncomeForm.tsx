import { useForm } from "react-hook-form";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { INCOME_RECURRENCES } from "@/shared/utils/constants";

export type IncomeFormValues = { source: string; amount: string; recurrence: string };

export function IncomeForm({
  onSubmit,
  pending,
}: {
  onSubmit: (values: IncomeFormValues) => Promise<void>;
  pending: boolean;
}) {
  const { register, handleSubmit, watch, reset } = useForm<IncomeFormValues>({
    defaultValues: { source: "", amount: "", recurrence: "monthly" },
  });
  const submit = handleSubmit(async (v) => {
    await onSubmit(v);
    reset();
  });
  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Fonte (ex: Salário)" className={fieldClass()} {...register("source", { required: true })} />
      <input
        type="number"
        step="0.01"
        placeholder="Valor R$"
        className={fieldClass()}
        {...register("amount", { required: true, min: 0 })}
      />
      <select className={fieldClass()} {...register("recurrence")}>
        {INCOME_RECURRENCES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!watch("source") || !watch("amount") || pending} className={primaryButtonClass()}>
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
