import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import type { Expense } from "@/shared/types";

/** Pergunta o valor real de uma conta variável no momento do pagamento. */
export function PayBillForm({
  bill,
  pending,
  onConfirm,
}: {
  bill: Expense;
  pending: boolean;
  onConfirm: (amount: number) => Promise<void> | void;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={async (ev) => {
        ev.preventDefault();
        const raw = new FormData(ev.currentTarget).get("amount") as string;
        const value = Number(raw);
        if (!raw || Number.isNaN(value)) return;
        await onConfirm(value);
      }}
    >
      <p className="text-sm text-sage-800/70">
        “{bill.description}” é uma conta de valor variável. Informe quanto foi pago neste mês.
      </p>
      <input
        name="amount"
        type="number"
        step="0.01"
        min={0}
        required
        autoFocus
        placeholder="Valor R$"
        className={fieldClass()}
      />
      <button type="submit" className={primaryButtonClass()} disabled={pending}>
        {pending ? "Salvando..." : "Confirmar pagamento"}
      </button>
    </form>
  );
}
