import type { Handler } from "../bus";
import { qk } from "@/shared/utils/query-keys";

/**
 * Manutenção recorrente. A rotação de `next_due` já acontece dentro do
 * service `completeMaintenance` (ver `maintenance.service.ts`) para manter
 * a operação atômica com a marcação de conclusão. Aqui apenas garantimos
 * que as queries de manutenção e agenda sejam invalidadas para refletir o
 * novo agendamento imediatamente na UI.
 */
export const handleMaintenanceCompleted: Handler<"maintenance.completed"> = (
  _event,
  { queryClient },
) => {
  queryClient.invalidateQueries({ queryKey: qk.maintenance.all });
  queryClient.invalidateQueries({ queryKey: qk.calendar.all });
};
