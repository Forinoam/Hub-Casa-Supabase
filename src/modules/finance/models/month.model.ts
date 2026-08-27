/**
 * Navegação por meses do Financeiro.
 *
 * `monthKey` é sempre "YYYY-MM". Além de filtrar os lançamentos reais do mês,
 * este model projeta as ocorrências futuras das contas recorrentes — elas ainda
 * não existem no banco (só nascem quando a anterior é paga), mas o usuário
 * precisa vê-las ao navegar para os próximos meses.
 */
import type { Expense } from "@/shared/types";
import { nextOccurrenceDate, isRecurring } from "@/shared/utils/recurrence";

/** Conta/gasto projetado: existe apenas na tela, não no banco. */
export type ProjectedExpense = Expense & { projected?: boolean };

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function monthKeyOf(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(now: Date = new Date()): string {
  return monthKeyOf(now);
}

export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
}

export function monthShortLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
}

export function isInMonth(date: string | null | undefined, monthKey: string): boolean {
  return !!date && date.slice(0, 7) === monthKey;
}

export function compareMonth(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Lançamentos reais com vencimento/data dentro do mês. */
export function filterMonth<T extends Pick<Expense, "due_date">>(items: T[], monthKey: string): T[] {
  return items.filter((e) => isInMonth(e.due_date, monthKey));
}

/**
 * Projeta as próximas ocorrências das contas recorrentes até o mês pedido.
 * Só projeta para o futuro e nunca duplica uma conta que já existe no mês.
 */
export function projectRecurringBills(
  bills: Expense[],
  monthKey: string,
  maxLookahead = 36,
): ProjectedExpense[] {
  const existing = new Set(
    bills
      .filter((b) => isInMonth(b.due_date, monthKey))
      .map((b) => `${b.description.toLowerCase()}|${b.category}`),
  );

  const out: ProjectedExpense[] = [];
  for (const bill of bills) {
    if (!isRecurring(bill.recurrence) || !bill.due_date) continue;
    if (bill.due_date.slice(0, 7) >= monthKey) continue;

    // A "cabeça" da série é a ocorrência mais recente dessa conta.
    const latest = bills
      .filter(
        (b) =>
          b.description.toLowerCase() === bill.description.toLowerCase() &&
          b.category === bill.category &&
          !!b.due_date,
      )
      .reduce((acc, b) => (b.due_date! > (acc.due_date ?? "") ? b : acc), bill);
    if (latest.id !== bill.id) continue;

    const key = `${bill.description.toLowerCase()}|${bill.category}`;
    if (existing.has(key)) continue;

    let cursor = bill.due_date;
    for (let i = 0; i < maxLookahead; i++) {
      const next = nextOccurrenceDate(bill.recurrence, cursor);
      if (!next) break;
      cursor = next;
      const cursorMonth = cursor.slice(0, 7);
      if (cursorMonth > monthKey) break;
      if (cursorMonth === monthKey) {
        out.push({
          ...bill,
          id: `projected:${bill.id}:${cursor}`,
          due_date: cursor,
          paid: false,
          projected: true,
        });
        existing.add(key);
        break;
      }
    }
  }
  return out;
}

export function isProjected(e: ProjectedExpense): boolean {
  return !!e.projected || e.id.startsWith("projected:");
}
