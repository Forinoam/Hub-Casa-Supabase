import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/shared/utils/head";
import { AppShell } from "@/shared/components/AppShell";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { RoundIconButton } from "@/shared/components/RoundIconButton";
import {
  useExpenses,
  useIncomes,
  useExpenseMutations,
  useIncomeMutations,
  useBudgets,
  useBudgetMutations,
} from "@/modules/finance";
import { useCards, useCardMutations } from "@/modules/finance/hooks/useCards";
import { buildBudgetStatuses } from "@/modules/finance/models/budget.model";
import { BudgetsList } from "@/modules/finance/components/BudgetsList";
import { BudgetForm } from "@/modules/finance/components/BudgetForm";
import { ExpenseModel } from "@/modules/finance/models/expense.model";
import {
  buildFinanceSummary,
  paymentAction,
  splitExpenses,
} from "@/modules/finance/models/finance.model";
import { FinanceSummaryCards } from "@/modules/finance/components/FinanceSummaryCards";
import {
  FinanceTabs,
  FINANCE_TAB_TITLES,
  type FinanceTab,
} from "@/modules/finance/components/FinanceTabs";
import { ExpensesList } from "@/modules/finance/components/ExpensesList";
import { IncomesList } from "@/modules/finance/components/IncomesList";
import { ExpenseForm } from "@/modules/finance/components/ExpenseForm";
import { IncomeForm } from "@/modules/finance/components/IncomeForm";
import { PayBillForm } from "@/modules/finance/components/PayBillForm";
import { CardForm } from "@/modules/finance/components/CardForm";
import { CardsList } from "@/modules/finance/components/CardsList";
import { CardInvoiceDetail } from "@/modules/finance/components/CardInvoiceDetail";
import { MonthNavigator } from "@/modules/finance/components/MonthNavigator";
import { buildCardInvoices, cardLabel, type CardInvoice } from "@/modules/finance/models/card.model";
import {
  currentMonthKey,
  filterMonth,
  isProjected,
  projectRecurringBills,
  monthLabel,
} from "@/modules/finance/models/month.model";
import type { Expense, PaymentCard } from "@/shared/types";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () =>
    pageHead({
      title: "Financeiro da casa — Casa Hub",
      description:
        "Contas a pagar, gastos, cartões e receitas da casa mês a mês, com vencimentos, parcelas e recorrência.",
      path: "/financeiro",
      noindex: true,
    }),
  component: FinancialPage,
});

function FinancialPage() {
  const [tab, setTab] = useState<FinanceTab>("bills");
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null);
  const [openInvoice, setOpenInvoice] = useState<CardInvoice | null>(null);
  /** Conta variável aguardando o valor real no momento do pagamento. */
  const [payingBill, setPayingBill] = useState<Expense | null>(null);

  const { data: expenses = [] } = useExpenses();
  const { data: incomes = [] } = useIncomes();
  const { data: budgets = [] } = useBudgets();
  const { data: cards = [] } = useCards();
  const budgetMut = useBudgetMutations();
  const expenseMut = useExpenseMutations();
  const incomeMut = useIncomeMutations();
  const cardMut = useCardMutations();

  const { bills, spends } = useMemo(() => splitExpenses(expenses), [expenses]);

  const monthBills = useMemo(
    () =>
      [...filterMonth(bills, monthKey), ...projectRecurringBills(bills, monthKey)].sort((a, b) =>
        (a.due_date ?? "").localeCompare(b.due_date ?? ""),
      ),
    [bills, monthKey],
  );
  const monthSpends = useMemo(
    () =>
      filterMonth(spends, monthKey).sort((a, b) =>
        (b.due_date ?? "").localeCompare(a.due_date ?? ""),
      ),
    [spends, monthKey],
  );
  const invoices = useMemo(
    () => buildCardInvoices(cards, expenses, monthKey),
    [cards, expenses, monthKey],
  );

  const budgetStatuses = useMemo(
    () => buildBudgetStatuses(budgets, expenses),
    [budgets, expenses],
  );
  const summary = useMemo(
    () => buildFinanceSummary(monthBills, monthSpends, incomes),
    [monthBills, monthSpends, incomes],
  );

  const closeSheet = () => {
    setOpen(false);
    setEditing(null);
    setEditingCard(null);
  };

  const projectedWarning = () =>
    toast.info(
      `Essa conta ainda não existe em ${monthLabel(monthKey)} — ela é criada quando a atual for paga.`,
    );

  const handleTogglePaid = (e: Expense) => {
    if (isProjected(e)) return projectedWarning();
    if (paymentAction(e) === "ask-amount") {
      setPayingBill(e);
      return;
    }
    expenseMut.togglePaid.mutate(e);
  };

  const openEditor = (e: Expense) => {
    if (isProjected(e)) return projectedWarning();
    setEditing(e);
    setOpen(true);
  };

  const removeExpense = (id: string, e?: Expense) => {
    if (e && isProjected(e)) return projectedWarning();
    expenseMut.remove.mutate(id);
  };

  return (
    <AppShell
      subtitle="Contas, gastos, cartões & receitas"
      title="Financeiro"
      action={
        <RoundIconButton
          icon="plus"
          label={FINANCE_TAB_TITLES[tab]}
          onClick={() => {
            setEditing(null);
            setEditingCard(null);
            setOpen(true);
          }}
        />
      }
    >
      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      <FinanceSummaryCards summary={summary} />

      <FinanceTabs
        tab={tab}
        onChange={setTab}
        counts={{
          bills: monthBills.filter((b) => !b.paid).length,
          spends: monthSpends.length,
          cards: cards.length,
          incomes: incomes.length,
          budgets: budgets.length,
        }}
      />

      {tab === "bills" && (
        <ExpensesList
          expenses={monthBills}
          emptyMessage="Nenhuma conta neste mês. Cadastre as contas da casa (aluguel, energia, internet…)."
          onTogglePaid={handleTogglePaid}
          onEdit={openEditor}
          onRemove={(id) => removeExpense(id, monthBills.find((b) => b.id === id))}
        />
      )}
      {tab === "spends" && (
        <ExpensesList
          expenses={monthSpends}
          emptyMessage="Nenhum gasto neste mês."
          onEdit={openEditor}
          onRemove={(id) => removeExpense(id)}
        />
      )}
      {tab === "cards" && (
        <CardsList
          invoices={invoices}
          onOpen={setOpenInvoice}
          onEdit={(inv) => {
            setEditingCard(inv.card);
            setOpen(true);
          }}
          onRemove={(id) => cardMut.remove.mutate(id)}
        />
      )}
      {tab === "incomes" && (
        <IncomesList incomes={incomes} onRemove={(id) => incomeMut.remove.mutate(id)} />
      )}
      {tab === "budgets" && (
        <BudgetsList statuses={budgetStatuses} onRemove={(id) => budgetMut.remove.mutate(id)} />
      )}

      <BottomSheet
        open={open}
        onClose={closeSheet}
        title={
          editingCard
            ? "Editar cartão"
            : editing
              ? ExpenseModel.isBill(editing)
                ? "Editar conta"
                : "Editar gasto"
              : FINANCE_TAB_TITLES[tab]
        }
      >
        {tab === "cards" || editingCard ? (
          <CardForm
            initial={editingCard}
            pending={cardMut.create.isPending || cardMut.update.isPending}
            onSubmit={async (values) => {
              const patch = {
                name: values.name,
                brand: values.brand || null,
                last4: values.last4 || null,
                color: values.color,
                closing_day: values.closing_day ? Number(values.closing_day) : null,
                due_day: values.due_day ? Number(values.due_day) : null,
              };
              if (editingCard) {
                await cardMut.update.mutateAsync({ id: editingCard.id, patch });
                toast.success("Cartão atualizado");
              } else {
                await cardMut.create.mutateAsync(patch);
                toast.success("Cartão salvo");
              }
              closeSheet();
            }}
          />
        ) : tab === "budgets" && !editing ? (
          <BudgetForm
            pending={budgetMut.upsert.isPending}
            onSubmit={async (values) => {
              await budgetMut.upsert.mutateAsync({
                category: values.category,
                amount: Number(values.amount),
              });
              toast.success("Orçamento salvo");
              closeSheet();
            }}
          />
        ) : tab === "incomes" && !editing ? (
          <IncomeForm
            pending={incomeMut.create.isPending}
            onSubmit={async (values) => {
              await incomeMut.create.mutateAsync({
                source: values.source,
                amount: Number(values.amount),
                recurrence: values.recurrence,
              });
              toast.success("Receita salva");
              closeSheet();
            }}
          />
        ) : (
          <ExpenseForm
            kind={editing ? ExpenseModel.kind(editing) : tab === "spends" ? "spend" : "bill"}
            initial={editing}
            cards={cards}
            pending={expenseMut.create.isPending || expenseMut.update.isPending}
            onSubmit={async (values, kind) => {
              const amount = values.amount === "" ? null : Number(values.amount);
              if (editing) {
                await expenseMut.update.mutateAsync({
                  id: editing.id,
                  patch: {
                    description: values.description,
                    amount,
                    category: values.category,
                    due_date: values.due_date || null,
                    recurrence: kind === "spend" ? null : values.recurrence || null,
                    payment_method: kind === "spend" ? values.payment_method || null : null,
                    card_id:
                      kind === "spend" && values.payment_method === "credit"
                        ? values.card_id || null
                        : null,
                  },
                });
                toast.success("Lançamento atualizado");
              } else {
                await expenseMut.create.mutateAsync({
                  description: values.description,
                  amount,
                  category: values.category,
                  due_date: values.due_date || null,
                  recurrence: values.recurrence || null,
                  kind,
                  payment_method: kind === "spend" ? values.payment_method || null : null,
                  card_id:
                    kind === "spend" && values.payment_method === "credit"
                      ? values.card_id || null
                      : null,
                  installments: Number(values.installments || 1),
                });
                toast.success(kind === "bill" ? "Conta salva" : "Gasto registrado");
              }
              closeSheet();
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={!!openInvoice}
        onClose={() => setOpenInvoice(null)}
        title={openInvoice ? `Fatura • ${cardLabel(openInvoice.card)}` : "Fatura"}
      >
        {openInvoice && <CardInvoiceDetail invoice={openInvoice} />}
      </BottomSheet>

      <BottomSheet open={!!payingBill} onClose={() => setPayingBill(null)} title="Qual foi o valor?">
        {payingBill && (
          <PayBillForm
            bill={payingBill}
            pending={expenseMut.update.isPending}
            onConfirm={async (value) => {
              await expenseMut.update.mutateAsync({ id: payingBill.id, patch: { amount: value } });
              expenseMut.togglePaid.mutate({ ...payingBill, amount: value });
              toast.success("Conta paga");
              setPayingBill(null);
            }}
          />
        )}
      </BottomSheet>
    </AppShell>
  );
}
