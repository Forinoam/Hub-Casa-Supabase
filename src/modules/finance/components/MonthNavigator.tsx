import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, currentMonthKey, monthLabel } from "../models/month.model";

/** Navegação mês a mês do Financeiro. */
export function MonthNavigator({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (monthKey: string) => void;
}) {
  const isCurrent = monthKey === currentMonthKey();
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl bg-white p-2 ring-1 ring-black/5">
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => onChange(addMonths(monthKey, -1))}
        className="grid size-9 place-items-center rounded-xl text-sage-800/60 hover:bg-sage-50"
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="text-center">
        <p className="text-sm font-medium capitalize">{monthLabel(monthKey)}</p>
        {!isCurrent && (
          <button
            type="button"
            onClick={() => onChange(currentMonthKey())}
            className="text-[10px] font-medium uppercase tracking-wider text-clay-600"
          >
            voltar para o mês atual
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => onChange(addMonths(monthKey, 1))}
        className="grid size-9 place-items-center rounded-xl text-sage-800/60 hover:bg-sage-50"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
