import { CardBlock } from "@/components/ui/card-block";
import { formatCurrency } from "@/shared/utils/format";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import type { FinanceSummary } from "../models/finance.model";
import type { ReactNode } from "react";

function StatCard({ icon, label, value, dark }: { icon: ReactNode; label: string; value: string; dark?: boolean }) {
  return (
    <CardBlock variant={dark ? "dark" : undefined} className="p-3">
      {icon}
      <p className={`mt-1 text-[10px] uppercase tracking-wider ${dark ? "opacity-70" : "text-sage-800/60"}`}>{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </CardBlock>
  );
}

export function FinanceSummaryCards({ summary }: { summary: FinanceSummary }) {
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatCard icon={<TrendingUp className="size-4 text-sage-800/60" />} label="Receita" value={formatCurrency(summary.monthlyIncome, { compact: true })} />
        <StatCard icon={<TrendingDown className="size-4 text-clay-600" />} label="Saídas" value={formatCurrency(summary.totalMonth, { compact: true })} />
        <StatCard icon={<Wallet className="size-4 opacity-70" />} label="Saldo" value={formatCurrency(summary.balance, { compact: true })} dark />
      </div>
      {summary.catList.length > 0 && (
        <CardBlock className="mb-4 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-sage-800/50">
            Por categoria (mês)
          </h3>
          <div className="space-y-2">
            {summary.catList.map(([cat, v]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs">
                  <span>{cat}</span>
                  <span className="text-sage-800/60">{formatCurrency(v)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sage-100">
                  <div className="h-full bg-sage-800" style={{ width: `${(v / summary.maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardBlock>
      )}
    </>
  );
}
