/**
 * Faturas de cartão de crédito.
 *
 * A fatura de um mês não é uma linha no banco: ela é a soma dos gastos
 * lançados como "crédito" naquele cartão com data dentro do mês. Compras
 * parceladas geram uma linha por mês, então a fatura sobe e desce sozinha
 * e a parcela simplesmente deixa de existir quando a série acaba.
 */
import type { Expense, PaymentCard } from "@/shared/types";
import { ExpenseModel } from "./expense.model";
import { isInMonth } from "./month.model";

export type CardInvoice = {
  card: PaymentCard;
  monthKey: string;
  items: Expense[];
  total: number;
  installmentCount: number;
};

/** Gastos que compõem a fatura de um cartão no mês. */
export function cardInvoiceItems(expenses: Expense[], cardId: string, monthKey: string): Expense[] {
  return expenses
    .filter((e) => e.card_id === cardId && isInMonth(e.due_date, monthKey))
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
}

export function buildCardInvoice(
  card: PaymentCard,
  expenses: Expense[],
  monthKey: string,
): CardInvoice {
  const items = cardInvoiceItems(expenses, card.id, monthKey);
  return {
    card,
    monthKey,
    items,
    total: items.reduce((s, e) => s + ExpenseModel.amount(e), 0),
    installmentCount: items.filter((e) => (e.installment_total ?? 0) > 1).length,
  };
}

export function buildCardInvoices(
  cards: PaymentCard[],
  expenses: Expense[],
  monthKey: string,
): CardInvoice[] {
  return cards.map((c) => buildCardInvoice(c, expenses, monthKey));
}

/** Rótulo curto do cartão para listas ("Nubank •• 1234"). */
export function cardLabel(card: Pick<PaymentCard, "name" | "last4">): string {
  return card.last4 ? `${card.name} •• ${card.last4}` : card.name;
}

export function installmentLabel(e: Pick<Expense, "installment_no" | "installment_total">): string | null {
  if (!e.installment_total || e.installment_total <= 1) return null;
  return `${e.installment_no ?? 1}/${e.installment_total}`;
}
