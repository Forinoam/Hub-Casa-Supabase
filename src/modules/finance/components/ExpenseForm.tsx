import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { useModuleCategories } from "@/modules/categories";
import { EXPENSE_CATEGORIES, EXPENSE_RECURRENCES, PAYMENT_METHODS } from "@/shared/utils/constants";
import type { Expense, PaymentCard } from "@/shared/types";
import type { ExpenseKindValue } from "../models/expense.model";
import { cardLabel } from "../models/card.model";

export type ExpenseFormValues = {
  description: string;
  amount: string;
  category: string;
  due_date: string;
  recurrence: string;
  payment_method: string;
  card_id: string;
  installments: string;
};

export function ExpenseForm({
  kind,
  initial,
  cards,
  onSubmit,
  pending,
}: {
  kind: ExpenseKindValue;
  initial: Expense | null;
  cards: PaymentCard[];
  onSubmit: (values: ExpenseFormValues, kind: ExpenseKindValue) => Promise<void>;
  pending: boolean;
}) {
  const categories = useModuleCategories("expenses", EXPENSE_CATEGORIES);
  const { register, handleSubmit, watch, reset } = useForm<ExpenseFormValues>({
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      due_date: "",
      recurrence: "",
      payment_method: "",
      card_id: "",
      installments: "1",
    },
  });

  useEffect(() => {
    reset({
      description: initial?.description ?? "",
      amount: initial?.amount === null || initial?.amount === undefined ? "" : String(initial.amount),
      category: initial?.category ?? "",
      due_date: initial?.due_date ?? "",
      recurrence: initial?.recurrence ?? "",
      payment_method: initial?.payment_method ?? "",
      card_id: initial?.card_id ?? "",
      installments: initial?.installment_total ? String(initial.installment_total) : "1",
    });
  }, [initial, reset]);

  const isBill = kind === "bill";
  const isCredit = watch("payment_method") === "credit";
  const isEditing = !!initial;
  const submit = handleSubmit(async (v) => {
    await onSubmit({ ...v, category: v.category || categories[0] }, kind);
    reset();
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Descrição" className={fieldClass()} {...register("description", { required: true })} />
      <input
        type="number"
        step="0.01"
        placeholder={isBill ? "Valor R$ (deixe vazio se variável)" : "Valor R$"}
        className={fieldClass()}
        {...register("amount", { required: !isBill, min: 0 })}
      />
      {isBill && (
        <p className="-mt-1 px-1 text-[11px] text-sage-800/50">
          Contas de valor variável (energia, água, cartão) podem ficar sem valor — ele é pedido na hora de pagar.
        </p>
      )}
      <select className={fieldClass()} {...register("category")}>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <div className="space-y-2">
        <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">
          {isBill ? "Vencimento" : "Data do gasto"}
        </label>
        <input type="date" className={fieldClass()} {...register("due_date")} />
      </div>
      {isBill && (
        <div className="space-y-2">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">Repetição</label>
          <select className={fieldClass()} {...register("recurrence")}>
            {EXPENSE_RECURRENCES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isBill && (
        <>
          <div className="space-y-2">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">
              Forma de pagamento
            </label>
            <select className={fieldClass()} {...register("payment_method")}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {isCredit && (
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">
                Cartão
              </label>
              {cards.length === 0 ? (
                <p className="px-1 text-[11px] text-sage-800/50">
                  Nenhum cartão cadastrado ainda — crie um na aba Cartões.
                </p>
              ) : (
                <select className={fieldClass()} {...register("card_id")}>
                  <option value="">Selecione o cartão</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {cardLabel(c)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {isCredit && !isEditing && (
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">
                Parcelas
              </label>
              <input
                type="number"
                min={1}
                max={48}
                step={1}
                className={fieldClass()}
                {...register("installments")}
              />
              <p className="px-1 text-[11px] text-sage-800/50">
                O valor é dividido e uma parcela entra na fatura de cada mês — a série termina sozinha.
              </p>
            </div>
          )}
        </>
      )}

      <button
        type="submit"
        disabled={!watch("description") || (!isBill && !watch("amount")) || pending}
        className={primaryButtonClass()}
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
