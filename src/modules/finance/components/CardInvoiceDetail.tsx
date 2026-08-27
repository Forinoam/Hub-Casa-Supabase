import { CardBlock } from "@/components/ui/card-block";
import { CategoryChip } from "@/shared/components/CategoryChip";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatCurrency, formatDate } from "@/shared/utils/format";
import type { CardInvoice } from "../models/card.model";
import { installmentLabel } from "../models/card.model";
import { monthLabel } from "../models/month.model";

/** Detalhe da fatura: cada gasto que compõe o total do cartão no mês. */
export function CardInvoiceDetail({ invoice }: { invoice: CardInvoice }) {
  return (
    <div className="space-y-4">
      <CardBlock className="flex items-center justify-between p-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-sage-800/50">
            {monthLabel(invoice.monthKey)}
          </p>
          <p className="mt-0.5 text-sm font-medium">Total da fatura</p>
        </div>
        <p className="text-lg font-semibold">{formatCurrency(invoice.total)}</p>
      </CardBlock>

      {invoice.items.length === 0 ? (
        <EmptyState message="Nenhum gasto neste cartão no mês selecionado." />
      ) : (
        <ul className="space-y-2">
          {invoice.items.map((e) => {
            const parcela = installmentLabel(e);
            return (
              <li key={e.id}>
                <CardBlock className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {e.description}
                      {parcela && (
                        <span className="ml-1 text-xs text-sage-800/50">({parcela})</span>
                      )}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-sage-800/60">
                      <CategoryChip name={e.category} module="expenses" />
                      {e.due_date && <span>{formatDate(e.due_date)}</span>}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(Number(e.amount ?? 0))}</p>
                </CardBlock>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
