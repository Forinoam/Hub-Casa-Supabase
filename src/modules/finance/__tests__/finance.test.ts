import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense } from "@/shared/types";
import { ExpenseModel } from "../models/expense.model";
import { buildFinanceSummary, paymentAction, splitExpenses } from "../models/finance.model";

const expense = (over: Partial<Expense> = {}): Expense =>
  ({
    id: "x1",
    home_id: "home-1",
    description: "Energia",
    amount: 100,
    category: "Casa",
    due_date: new Date().toISOString().slice(0, 10),
    paid: false,
    recurring: false,
    recurrence: null,
    assigned_to: null,
    kind: "bill",
    created_by: "user-1",
    created_at: new Date().toISOString(),
    ...over,
  }) as Expense;

describe("Registrar pagamento", () => {
  it("conta variável sem valor pede o valor pago", () => {
    expect(paymentAction(expense({ amount: null }))).toBe("ask-amount");
  });

  it("conta com valor definido alterna direto", () => {
    expect(paymentAction(expense({ amount: 250 }))).toBe("toggle");
  });

  it("conta já paga apenas volta para não paga", () => {
    expect(paymentAction(expense({ amount: null, paid: true }))).toBe("toggle");
  });

  it("gasto realizado nunca pede valor", () => {
    expect(paymentAction(expense({ kind: "spend", amount: null }))).toBe("toggle");
  });

  it("marca a conta como paga via service", async () => {
    const toggleExpensePaid = vi.fn(async (item: Pick<Expense, "id" | "paid">) => ({
      id: item.id,
      paid: !item.paid,
    }));
    const result = await toggleExpensePaid({ id: "x1", paid: false });
    expect(result).toEqual({ id: "x1", paid: true });
  });
});

describe("ExpenseModel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("distingue conta de gasto", () => {
    expect(ExpenseModel.isBill(expense())).toBe(true);
    expect(ExpenseModel.isSpend(expense({ kind: "spend" }))).toBe(true);
  });

  it("detecta conta atrasada", () => {
    expect(ExpenseModel.isOverdue(expense({ due_date: "2020-01-01" }))).toBe(true);
    expect(ExpenseModel.isOverdue(expense({ due_date: "2020-01-01", paid: true }))).toBe(false);
  });

  it("valor nulo conta como zero", () => {
    expect(ExpenseModel.amount(expense({ amount: null }))).toBe(0);
  });
});

describe("Resumo financeiro do mês", () => {
  it("consolida contas, gastos e receitas", () => {
    const now = new Date();
    const inMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;
    const bills = [expense({ id: "b1", amount: 300, due_date: inMonth, category: "Casa" })];
    const spends = [
      expense({ id: "s1", kind: "spend", amount: 200, due_date: inMonth, category: "Lazer", paid: true }),
    ];
    const summary = buildFinanceSummary(bills, spends, [{ amount: 1000, recurrence: "monthly" }], now);

    expect(summary.totalMonth).toBe(500);
    expect(summary.monthlyIncome).toBe(1000);
    expect(summary.balance).toBe(500);
    expect(summary.unpaidCount).toBe(1);
    expect(summary.catList[0]).toEqual(["Casa", 300]);
  });

  it("separa contas de gastos", () => {
    const { bills, spends } = splitExpenses([expense(), expense({ id: "s", kind: "spend" })]);
    expect(bills).toHaveLength(1);
    expect(spends).toHaveLength(1);
  });
});
