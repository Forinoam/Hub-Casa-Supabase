/**
 * Dashboard module — placeholder for the aggregated summary service
 * (tasks + shopping + maintenance + ranking in one call). The dashboard
 * route currently composes hooks from other modules; the future
 * `dashboardService.summary(homeId)` will replace those parallel queries
 * with a single RPC/view.
 */
import type { Task, ShoppingItem, MaintenanceItem } from "@/shared/types";

export type DashboardSummary = {
  todayTasks: Task[];
  urgentShopping: Pick<ShoppingItem, "id" | "name">[];
  nextMaintenance: Pick<MaintenanceItem, "id" | "name" | "next_due"> | null;
};

/** Reserved for the future consolidated dashboard endpoint. */
export async function fetchDashboardSummary(_homeId: string): Promise<DashboardSummary> {
  throw new Error("Not implemented — dashboard route composes per-module hooks.");
}
