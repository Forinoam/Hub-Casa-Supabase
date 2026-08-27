import { describe, expect, it } from "vitest";
import {
  buildBudgetStatuses,
  budgetTotals,
  levelFor,
  spentByCategory,
} from "../models/budget.model";
import type { Budget, Expense } from "@/shared/types";

const now = new Date();
const day = (d: number) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const expense = (over: Partial<Expense> = {}): Expense =>
  ({
    id: "e1",
    home_id: "h",
    description: "Conta",
    amount: 100,
    category: "Mercado",
    due_date: day(10),
    paid: false,
    recurring: false,
    recurrence: null,
    assigned_to: null,
    kind: "bill",
    created_by: "u",
    created_at: now.toISOString(),
    ...over,
  }) as Expense;

const budget = (over: Partial<Budget> = {}): Budget =>
  ({
    id: "b1",
    home_id: "h",
    category: "Mercado",
    amount: 1000,
    created_by: "u",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...over,
  }) as Budget;

describe("Níveis de orçamento", () => {
  it("classifica ok, alerta e estouro", () => {
    expect(levelFor(50)).toBe("ok");
    expect(levelFor(80)).toBe("warn");
    expect(levelFor(100)).toBe("over");
    expect(levelFor(140)).toBe("over");
  });

  it("soma apenas lançamentos do mês corrente", () => {
    const map = spentByCategory(
      [expense({ amount: 200 }), expense({ id: "e2", amount: 50, due_date: "2000-01-05" })],
      now,
    );
    expect(map["Mercado"]).toBe(200);
  });

  it("cruza limite e gasto por categoria", () => {
    const [status] = buildBudgetStatuses([budget()], [expense({ amount: 850 })], now);
    expect(status.spent).toBe(850);
    expect(status.percent).toBe(85);
    expect(status.remaining).toBe(150);
    expect(status.level).toBe("warn");
  });

  it("ordena do mais estourado ao mais folgado", () => {
    const statuses = buildBudgetStatuses(
      [budget(), budget({ id: "b2", category: "Lazer", amount: 100 })],
      [expense({ amount: 100 }), expense({ id: "e2", category: "Lazer", amount: 300 })],
      now,
    );
    expect(statuses.map((s) => s.category)).toEqual(["Lazer", "Mercado"]);
    expect(statuses[0].level).toBe("over");
  });

  it("consolida os totais", () => {
    const totals = budgetTotals(
      buildBudgetStatuses(
        [budget(), budget({ id: "b2", category: "Lazer", amount: 1000 })],
        [expense({ amount: 500 }), expense({ id: "e2", category: "Lazer", amount: 500 })],
        now,
      ),
    );
    expect(totals).toEqual({ limit: 2000, spent: 1000, percent: 50, level: "ok" });
  });
});
