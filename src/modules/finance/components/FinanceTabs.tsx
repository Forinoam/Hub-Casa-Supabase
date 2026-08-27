import type { ReactNode } from "react";

export type FinanceTab = "bills" | "spends" | "cards" | "incomes" | "budgets";

export const FINANCE_TAB_TITLES: Record<FinanceTab, string> = {
  bills: "Nova conta",
  spends: "Novo gasto",
  cards: "Novo cartão",
  incomes: "Nova receita",
  budgets: "Novo orçamento",
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-medium ${
        active ? "bg-sage-800 text-sage-50" : "text-sage-800/60"
      }`}
    >
      {children}
    </button>
  );
}

export function FinanceTabs({
  tab,
  onChange,
  counts,
}: {
  tab: FinanceTab;
  onChange: (tab: FinanceTab) => void;
  counts: { bills: number; spends: number; cards: number; incomes: number; budgets: number };
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-black/5">
      <TabButton active={tab === "bills"} onClick={() => onChange("bills")}>
        Contas ({counts.bills})
      </TabButton>
      <TabButton active={tab === "spends"} onClick={() => onChange("spends")}>
        Gastos ({counts.spends})
      </TabButton>
      <TabButton active={tab === "cards"} onClick={() => onChange("cards")}>
        Cartões ({counts.cards})
      </TabButton>
      <TabButton active={tab === "incomes"} onClick={() => onChange("incomes")}>
        Receitas ({counts.incomes})
      </TabButton>
      <TabButton active={tab === "budgets"} onClick={() => onChange("budgets")}>
        Orçamentos ({counts.budgets})
      </TabButton>
    </div>
  );
}
