/**
 * Regras de negócio do módulo Financeiro — puras e testáveis, sem React.
 */
import type { Expense, Income } from "@/shared/types";
import { ExpenseModel } from "./expense.model";

export type FinanceSummary = {
  totalMonth: number;
  monthlyIncome: number;
  balance: number;
  unpaidCount: number;
  catList: Array<[string, number]>;
  maxCat: number;
};

type IncomeLike = Pick<Income, "amount" | "recurrence">;

function inMonth(date: string | null | undefined, ref: Date): boolean {
  if (!date) return false;
  const d = new Date(`${date.slice(0, 10)}T00:00:00`);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

/** Consolida contas, gastos e receitas do mês de referência. */
export function buildFinanceSummary(
  bills: Expense[],
  spends: Expense[],
  incomes: IncomeLike[],
  now: Date = new Date(),
): FinanceSummary {
  const monthBills = bills.filter((e) => inMonth(e.due_date, now));
  const monthSpends = spends.filter((e) => inMonth(e.due_date, now));
  const totalBills = monthBills.reduce((s, e) => s + ExpenseModel.amount(e), 0);
  const totalSpends = monthSpends.reduce((s, e) => s + ExpenseModel.amount(e), 0);
  const monthlyIncome = incomes
    .filter((i) => i.recurrence === "monthly")
    .reduce((s, i) => s + Number(i.amount ?? 0), 0);

  const byCat = [...monthBills, ...monthSpends].reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + ExpenseModel.amount(e);
    return acc;
  }, {});
  const catList = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    totalMonth: totalBills + totalSpends,
    monthlyIncome,
    balance: monthlyIncome - totalBills - totalSpends,
    unpaidCount: bills.filter((e) => !e.paid).length,
    catList,
    maxCat: Math.max(1, ...catList.map(([, v]) => v)),
  };
}

/** Separa a lista de lançamentos em contas a pagar e gastos realizados. */
export function splitExpenses(expenses: Expense[]) {
  return {
    bills: expenses.filter((e) => ExpenseModel.isBill(e)),
    spends: expenses.filter((e) => ExpenseModel.isSpend(e)),
  };
}

/**
 * Decide o que acontece ao clicar em "marcar paga":
 *  - "ask-amount": conta variável sem valor → pedir o valor pago
 *  - "toggle": alterna pago/não pago direto
 */
export function paymentAction(e: Expense): "ask-amount" | "toggle" {
  return !e.paid && ExpenseModel.needsAmount(e) ? "ask-amount" : "toggle";
}
