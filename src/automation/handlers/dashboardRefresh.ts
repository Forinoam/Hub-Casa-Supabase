import type { Handler } from "../bus";
import { qk } from "@/shared/utils/query-keys";

/**
 * Any domain event that mutates state can shift the House Index, priorities
 * or timeline — so we invalidate the dashboard read-model on every event.
 * Per-module invalidations remain the responsibility of the emitting hook;
 * this handler only ensures the aggregate view catches up.
 */
export const handleDashboardRefresh: Handler = (_event, { queryClient }) => {
  queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
};
