import type { MaintenanceItem } from "@/shared/types";
import { todayKey } from "@/shared/utils/format";
import type { Insight } from "./types";

export function buildMaintenanceDueInsight(items: MaintenanceItem[]): Insight | null {
  const today = todayKey();
  const in3 = new Date();
  in3.setDate(in3.getDate() + 3);
  const soon = in3.toISOString().slice(0, 10);
  const due = items.filter((m) => m.next_due && m.next_due <= soon);
  if (due.length === 0) return null;
  const overdue = due.filter((m) => (m.next_due ?? "") < today);
  return {
    id: "insight-maintenance-due",
    kind: "maintenanceDue",
    severity: overdue.length > 0 ? 3 : 2,
    title: overdue.length > 0
      ? `${overdue.length} manutenção(ões) vencida(s)`
      : `${due.length} manutenção(ões) próxima(s)`,
    description: due.slice(0, 3).map((m) => m.name).join(", "),
    route: "/manutencao",
  };
}
