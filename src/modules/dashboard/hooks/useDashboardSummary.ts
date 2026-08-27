import { useMemo } from "react";
import { useTasks } from "@/modules/tasks";
import { useShoppingItems } from "@/modules/shopping";
import { useUpcomingEvents } from "@/modules/calendar";
import { useExpenses, useIncomes, useBudgets } from "@/modules/finance";
import { useMaintenance } from "@/modules/maintenance";
import { useMemories } from "@/modules/memories";
import { TaskModel } from "@/modules/tasks/models/task.model";
import { ExpenseModel } from "@/modules/finance/models/expense.model";
import { computeHouseIndex } from "../utils/houseIndex";
import { buildPriorities } from "../utils/priorities";
import { buildTimeline } from "../utils/timeline";
import { buildSuggestion } from "../utils/suggestions";
import { buildInsights } from "../insights";

/**
 * Consolidated dashboard read-model. Reuses existing per-module hooks so the
 * React Query cache stays granular; derivations are memoized locally so
 * navigation/scroll don't recompute the aggregates.
 */
export function useDashboardSummary() {
  const tasks = useTasks();
  const shopping = useShoppingItems();
  const events = useUpcomingEvents();
  const expenses = useExpenses();
  const incomes = useIncomes();
  const maintenance = useMaintenance();
  const memories = useMemories();
  const budgets = useBudgets();

  const tasksData = tasks.data ?? [];
  const shoppingData = shopping.data ?? [];
  const eventsData = events.data ?? [];
  const expensesData = expenses.data ?? [];
  const incomesData = incomes.data ?? [];
  const maintenanceData = maintenance.data ?? [];
  const memoriesData = memories.data ?? [];
  const budgetsData = budgets.data ?? [];

  const derived = useMemo(() => {
    const priorities = buildPriorities({
      tasks: tasksData,
      shopping: shoppingData,
      expenses: expensesData,
      maintenance: maintenanceData,
      events: eventsData,
    });

    const timeline = buildTimeline({
      events: eventsData,
      maintenance: maintenanceData,
      expenses: expensesData,
      excludeIds: priorities.map((p) => p.id),
    });

    const house = computeHouseIndex({
      tasks: tasksData,
      shopping: shoppingData,
      expenses: expensesData,
      maintenance: maintenanceData,
    });

    const pendingTasks = tasksData.filter((t) => !t.completed).length;
    const overdueTasks = tasksData.filter((t) => TaskModel.isOverdue(t)).length;
    const pendingShopping = shoppingData.filter((s) => !s.bought).length;
    const unpaid = expensesData.filter((e) => !e.paid);
    const overdueBills = unpaid.filter((e) => ExpenseModel.isOverdue(e)).length;

    const now = Date.now();
    const upcomingEvents = eventsData.filter((e) => new Date(e.start_at).getTime() >= now).length;
    const nextMaintenance = [...maintenanceData]
      .filter((m) => !!m.next_due)
      .sort((a, b) => (a.next_due! < b.next_due! ? -1 : 1))[0] ?? null;

    // Flashback: memória com mesmo dia/mês em anos anteriores
    const today = new Date();
    const flashback = memoriesData.find((m) => {
      const d = new Date(`${m.date}T00:00:00`);
      return d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate()
        && d.getFullYear() < today.getFullYear();
    }) ?? null;

    const monthlyIncome = incomesData.reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
    const monthlyExpenses = unpaid.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
    const balance = monthlyIncome - monthlyExpenses;
    const monthlyPaid = expensesData
      .filter((e) => e.paid)
      .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
    const pendingBillsCount = unpaid.length;

    const suggestion = buildSuggestion({
      priorities,
      house,
      overdueBillsCount: overdueBills,
    });

    const insights = buildInsights({
      tasks: tasksData,
      shopping: shoppingData,
      expenses: expensesData,
      maintenance: maintenanceData,
      events: eventsData,
      balance,
      budgets: budgetsData,
    });

    return {
      priorities,
      timeline,
      house,
      insights,
      indicators: {
        pendingTasks,
        overdueTasks,
        pendingShopping,
        overdueBills,
        upcomingEvents,
      },
      finance: { balance, monthlyIncome, monthlyExpenses, monthlyPaid, pendingBillsCount },
      nextMaintenance,
      flashback,
      suggestion,
    };
  }, [
    tasksData, shoppingData, eventsData, expensesData, incomesData,
    maintenanceData, memoriesData, budgetsData,
  ]);

  return {
    ...derived,
    isLoading:
      tasks.isLoading || shopping.isLoading || events.isLoading ||
      expenses.isLoading || maintenance.isLoading,
  };
}
