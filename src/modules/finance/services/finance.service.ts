import { supabase } from "@/integrations/supabase/client";
import type { Expense, Income } from "@/shared/types";

export async function listExpenses(homeId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("home_id", homeId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function listIncomes(homeId: string): Promise<Income[]> {
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type CreateExpenseInput = {
  description: string;
  /** null = conta variável cujo valor ainda não é conhecido. */
  amount: number | null;
  category: string;
  due_date?: string | null;
  recurrence?: string | null;
  /** "bill" = conta a pagar; "spend" = gasto já realizado. */
  kind?: "bill" | "spend";
  /** Forma de pagamento do gasto ("credit", "pix"…). */
  payment_method?: string | null;
  /** Cartão usado quando `payment_method === "credit"`. */
  card_id?: string | null;
  /** Número de parcelas (1 = à vista). */
  installments?: number | null;
};

/** Soma meses a uma data "YYYY-MM-DD" preservando o fim de mês curto. */
function addMonthsToDate(date: string, delta: number): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const last = new Date(y, m - 1 + delta + 1, 0).getDate();
  const target = new Date(y, m - 1 + delta, Math.min(d, last));
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(
    target.getDate(),
  ).padStart(2, "0")}`;
}

export async function createExpense(homeId: string, userId: string, input: CreateExpenseInput) {
  const kind = input.kind ?? "bill";
  const isCredit = input.payment_method === "credit";
  const baseDate =
    input.due_date || (kind === "spend" ? new Date().toISOString().slice(0, 10) : null);
  const total = Math.max(1, Math.floor(input.installments ?? 1));

  // Compra parcelada no crédito: uma linha por mês, para a fatura de cada mês
  // refletir só a parcela daquele mês e a série acabar sozinha.
  if (kind === "spend" && isCredit && total > 1 && baseDate && input.amount !== null) {
    const group = crypto.randomUUID();
    const per = Math.round((input.amount / total) * 100) / 100;
    const rows = Array.from({ length: total }, (_, i) => ({
      home_id: homeId,
      description: input.description,
      // Última parcela absorve o arredondamento.
      amount: i === total - 1 ? Math.round((input.amount! - per * (total - 1)) * 100) / 100 : per,
      category: input.category,
      due_date: addMonthsToDate(baseDate, i),
      recurrence: null,
      paid: i === 0,
      kind,
      payment_method: "credit",
      card_id: input.card_id || null,
      installment_group: group,
      installment_no: i + 1,
      installment_total: total,
      created_by: userId,
    }));
    const { data, error } = await supabase.from("expenses").insert(rows).select("*");
    if (error) throw error;
    return data?.[0] ?? null;
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      home_id: homeId,
      description: input.description,
      amount: input.amount,
      category: input.category,
      // Gasto já aconteceu: registra a data e nasce quitado.
      due_date: baseDate,
      recurrence: kind === "spend" ? null : input.recurrence || null,
      paid: kind === "spend",
      kind,
      payment_method: input.payment_method || null,
      card_id: isCredit ? input.card_id || null : null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export type UpdateExpenseInput = Partial<{
  description: string;
  amount: number | null;
  category: string;
  due_date: string | null;
  recurrence: string | null;
  paid: boolean;
  kind: "bill" | "spend";
  payment_method: string | null;
  card_id: string | null;
}>;

export async function updateExpense(id: string, patch: UpdateExpenseInput) {
  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function toggleExpensePaid(item: Pick<Expense, "id" | "paid">) {
  const { error } = await supabase.from("expenses").update({ paid: !item.paid }).eq("id", item.id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export type CreateIncomeInput = { source: string; amount: number; recurrence: string };

export async function createIncome(homeId: string, userId: string, input: CreateIncomeInput) {
  const { data, error } = await supabase
    .from("incomes")
    .insert({
      home_id: homeId,
      source: input.source,
      amount: input.amount,
      recurrence: input.recurrence,
      owner_id: userId,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteIncome(id: string) {
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) throw error;
}
