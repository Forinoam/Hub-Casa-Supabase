import { CardBlock } from "@/components/ui/card-block";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatCurrency } from "@/shared/utils/format";
import { CreditCard, Pencil, X } from "lucide-react";
import type { CardInvoice } from "../models/card.model";
import { cardLabel } from "../models/card.model";

export function CardsList({
  invoices,
  onOpen,
  onEdit,
  onRemove,
}: {
  invoices: CardInvoice[];
  onOpen: (invoice: CardInvoice) => void;
  onEdit: (invoice: CardInvoice) => void;
  onRemove: (id: string) => void;
}) {
  if (invoices.length === 0) {
    return <EmptyState message="Cadastre seus cartões para acompanhar a fatura de cada mês." />;
  }
  return (
    <ul className="space-y-3">
      {invoices.map((inv) => (
        <li key={inv.card.id} id={`item-${inv.card.id}`}>
          <CardBlock className="flex items-center gap-3 p-4">
            <button
              type="button"
              onClick={() => onOpen(inv)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
                style={{ backgroundColor: inv.card.color }}
              >
                <CreditCard className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cardLabel(inv.card)}</p>
                <p className="mt-0.5 text-xs text-sage-800/60">
                  {inv.items.length === 0
                    ? "sem gastos neste mês"
                    : `${inv.items.length} ${inv.items.length === 1 ? "gasto" : "gastos"}`}
                  {inv.installmentCount > 0 && ` • ${inv.installmentCount} parcelado(s)`}
                  {inv.card.due_day && ` • vence dia ${inv.card.due_day}`}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(inv.total)}</p>
            </button>
            <button
              type="button"
              onClick={() => onEdit(inv)}
              aria-label="Editar cartão"
              className="text-sage-800/30 hover:text-sage-800"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(inv.card.id)}
              aria-label="Remover cartão"
              className="text-sage-800/30 hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </CardBlock>
        </li>
      ))}
    </ul>
  );
}
