import { Link } from "@tanstack/react-router";
import { ArrowRight, TrendingDown, TrendingUp, Receipt } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";
import { formatCurrency } from "@/shared/utils/format";

interface Props {
  income: number;
  spent: number;
  pendingBills: number;
  pendingBillsCount: number;
}

/**
 * "Ritmo do mês" — leitura financeira do mês corrente. Não repete nenhum
 * número mostrado no hero (que fala de vencidas) nem na timeline (datas):
 * aqui o assunto é quanto entrou, quanto saiu e quanto ainda falta pagar.
 */
export function MonthPulseCard({ income, spent, pendingBills, pendingBillsCount }: Props) {
  if (income === 0 && spent === 0 && pendingBills === 0) return null;

  const base = Math.max(income, spent + pendingBills, 1);
  const spentPct = Math.min(100, (spent / base) * 100);
  const pendingPct = Math.min(100 - spentPct, (pendingBills / base) * 100);
  const left = income - spent - pendingBills;

  return (
    <div>
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-sage-800/50">
        Ritmo do mês
      </h2>
      <Link to="/financeiro" className="block">
        <CardBlock className="p-5 transition active:scale-[0.99]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-sage-800/50">
                {left >= 0 ? "Livre depois das contas" : "Acima do previsto"}
              </span>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${left >= 0 ? "text-sage-800" : "text-clay-600"}`}>
                {formatCurrency(Math.abs(left))}
              </p>
            </div>
            <ArrowRight className="mb-1 size-4 shrink-0 text-sage-800/25" />
          </div>

          <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-sage-100">
            <div className="h-full bg-sage-800" style={{ width: `${spentPct}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${pendingPct}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric icon={TrendingUp} label="Entrou" value={formatCurrency(income)} />
            <Metric icon={TrendingDown} label="Já saiu" value={formatCurrency(spent)} />
            <Metric
              icon={Receipt}
              label={pendingBillsCount > 0 ? `A pagar (${pendingBillsCount})` : "A pagar"}
              value={formatCurrency(pendingBills)}
            />
          </div>
        </CardBlock>
      </Link>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-sage-800/45">
        <Icon className="size-3" strokeWidth={2.5} /> {label}
      </span>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-sage-800">{value}</p>
    </div>
  );
}
