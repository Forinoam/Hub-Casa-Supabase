import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { CATEGORY_COLORS } from "@/shared/utils/constants";
import type { PaymentCard } from "@/shared/types";

export type CardFormValues = {
  name: string;
  brand: string;
  last4: string;
  color: string;
  closing_day: string;
  due_day: string;
};

export function CardForm({
  initial,
  pending,
  onSubmit,
}: {
  initial: PaymentCard | null;
  pending: boolean;
  onSubmit: (values: CardFormValues) => Promise<void>;
}) {
  const { register, handleSubmit, watch, setValue, reset } = useForm<CardFormValues>({
    defaultValues: {
      name: "",
      brand: "",
      last4: "",
      color: CATEGORY_COLORS[0],
      closing_day: "",
      due_day: "",
    },
  });

  useEffect(() => {
    reset({
      name: initial?.name ?? "",
      brand: initial?.brand ?? "",
      last4: initial?.last4 ?? "",
      color: initial?.color ?? CATEGORY_COLORS[0],
      closing_day: initial?.closing_day ? String(initial.closing_day) : "",
      due_day: initial?.due_day ? String(initial.due_day) : "",
    });
  }, [initial, reset]);

  const color = watch("color");

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(async (v) => {
        await onSubmit(v);
        reset();
      })}
    >
      <input placeholder="Nome do cartão" className={fieldClass()} {...register("name", { required: true })} />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Bandeira" className={fieldClass()} {...register("brand")} />
        <input placeholder="Final (4 dígitos)" maxLength={4} className={fieldClass()} {...register("last4")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">
            Fechamento
          </label>
          <input type="number" min={1} max={31} className={fieldClass()} {...register("closing_day")} />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">
            Vencimento
          </label>
          <input type="number" min={1} max={31} className={fieldClass()} {...register("due_day")} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">Cor</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => setValue("color", c)}
              style={{ backgroundColor: c }}
              className={`size-8 rounded-full ${color === c ? "ring-2 ring-sage-800 ring-offset-2" : ""}`}
            />
          ))}
        </div>
      </div>
      <button type="submit" disabled={!watch("name") || pending} className={primaryButtonClass()}>
        {pending ? "Salvando..." : "Salvar cartão"}
      </button>
    </form>
  );
}
