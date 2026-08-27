/**
 * Handler registry. Importing this module wires every handler to the bus.
 * `registerAutomationHandlers` is idempotent — safe to call more than once
 * (e.g. on hot-reload).
 */
import { subscribe } from "../bus";
import { handleShoppingToExpense } from "./shoppingToExpense";
import { handleMaintenanceCompleted } from "./maintenanceRecurring";
import { handleExpenseRecurring } from "./financeRecurring";
import { handleDashboardRefresh } from "./dashboardRefresh";
import { handleHistoryLog } from "./historyLog";

let installed = false;
const disposers: Array<() => void> = [];

export function registerAutomationHandlers(): () => void {
  if (installed) return teardown;
  installed = true;

  disposers.push(subscribe("shopping.completed", handleShoppingToExpense));
  disposers.push(subscribe("maintenance.completed", handleMaintenanceCompleted));
  disposers.push(subscribe("expense.paid", handleExpenseRecurring));
  disposers.push(subscribe("*", handleDashboardRefresh));
  disposers.push(subscribe("*", handleHistoryLog));

  return teardown;
}

function teardown() {
  disposers.splice(0).forEach((d) => d());
  installed = false;
}
