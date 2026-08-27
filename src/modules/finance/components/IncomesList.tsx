import { CardBlock } from "@/components/ui/card-block";
import { EmptyState } from "@/shared/components/EmptyState";
import { INCOME_RECURRENCES } from "@/shared/utils/constants";
import { formatCurrency } from "@/shared/utils/format";
import { X } from "lucide-react";
import type { Income } from "@/shared/types";

export function IncomesList({
  incomes,
  onRemove,
}: {
  incomes: Income[];
  onRemove: (id: string) => void;
}) {
  if (incomes.length === 0) return <EmptyState message="Adicione a renda mensal da casa." />;
  return (
    <ul className="space-y-3">
      {incomes.map((i) => (
        <li key={i.id}>
          <CardBlock className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{i.source}</p>
              <p className="text-xs text-sage-800/60">
                {INCOME_RECURRENCES.find((r) => r.id === i.recurrence)?.label ?? i.recurrence}
              </p>
            </div>
            <p className="text-sm font-semibold">{formatCurrency(i.amount ?? 0)}</p>
            <button
              type="button"
              onClick={() => onRemove(i.id)}
              aria-label="Remover receita"
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
