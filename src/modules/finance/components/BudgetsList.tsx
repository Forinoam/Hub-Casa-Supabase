import { CardBlock } from "@/components/ui/card-block";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatCurrency } from "@/shared/utils/format";
import { Trash2 } from "lucide-react";
import type { BudgetStatus } from "../models/budget.model";
import { budgetTotals } from "../models/budget.model";

const BAR: Record<BudgetStatus["level"], string> = {
  ok: "bg-sage-800",
  warn: "bg-clay-500",
  over: "bg-clay-600",
};

const LABEL: Record<BudgetStatus["level"], string> = {
  ok: "Dentro do limite",
  warn: "Perto do limite",
  over: "Limite estourado",
};

export function BudgetsList({
  statuses,
  onRemove,
}: {
  statuses: BudgetStatus[];
  onRemove: (id: string) => void;
}) {
  if (statuses.length === 0) {
    return (
      <EmptyState message="Defina um limite mensal por categoria e receba alertas ao se aproximar dele." />
    );
  }

  const totals = budgetTotals(statuses);

  return (
    <div className="space-y-3">
      <CardBlock variant="dark" className="p-4">
        <p className="text-[10px] uppercase tracking-wider opacity-70">Total do mês</p>
        <p className="text-lg font-semibold">
          {formatCurrency(totals.spent)} <span className="text-sm opacity-70">/ {formatCurrency(totals.limit)}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className={`h-full ${BAR[totals.level]}`} style={{ width: `${Math.min(totals.percent, 100)}%` }} />
        </div>
      </CardBlock>

      {statuses.map((b) => (
        <div key={b.id} id={`item-${b.id}`}>
        <CardBlock className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{b.category}</p>
              <p className="text-xs text-sage-800/60">
                {formatCurrency(b.spent)} de {formatCurrency(b.limit)} · {LABEL[b.level]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{b.percent}%</span>
              <button
                type="button"
                aria-label={`Remover orçamento de ${b.category}`}
                onClick={() => onRemove(b.id)}
                className="text-sage-800/40 hover:text-clay-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-100">
            <div className={`h-full ${BAR[b.level]}`} style={{ width: `${Math.min(b.percent, 100)}%` }} />
          </div>
          {b.remaining >= 0 ? (
            <p className="mt-1 text-[11px] text-sage-800/50">Resta {formatCurrency(b.remaining)}</p>
          ) : (
            <p className="mt-1 text-[11px] text-clay-600">
              Excedeu em {formatCurrency(Math.abs(b.remaining))}
            </p>
          )}
        </CardBlock>
        </div>
      ))}
    </div>
  );
}
