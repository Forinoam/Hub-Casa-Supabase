import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import { emit } from "@/automation/bus";
import type { MaintenanceItem } from "@/shared/types";
import * as service from "../services/maintenance.service";

const SCOPE = "Manutenção";

export function useMaintenance() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.maintenance.list(homeId),
    enabled: !!homeId,
    staleTime: STALE.medium,
    queryFn: () => service.listMaintenance(homeId!),
  });
}

export function useNextMaintenance() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.maintenance.next(homeId),
    enabled: !!homeId,
    staleTime: STALE.medium,
    queryFn: () => service.nextMaintenance(homeId!),
  });
}

export function useMaintenanceMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.maintenance.all });
    qc.invalidateQueries({ queryKey: qk.dashboard.all });
  };

  const create = useMutation({
    mutationFn: (input: { name: string; next_due?: string | null; last_done?: string | null; interval_days?: number | null }) => {
      assertHomeContext(SCOPE, "guard", homeId);
      return service.createMaintenance(homeId, input);
    },
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e, "Erro ao salvar manutenção."),
  });

  const complete = useMutation({
    mutationFn: async (item: Pick<MaintenanceItem, "id" | "name" | "interval_days">) => {
      assertHomeContext(SCOPE, "guard", homeId);
      const { nextDue } = await service.completeMaintenance(item);
      return { item, nextDue };
    },
    onSuccess: ({ item, nextDue }) => {
      invalidate();
      emit({
        type: "maintenance.completed",
        homeId: homeId!,
        itemId: item.id,
        name: item.name,
        intervalDays: item.interval_days ?? null,
        nextDue,
      });
    },
    onError: (e) => reportError(SCOPE, e, "Erro ao concluir manutenção."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteMaintenance(id),
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e),
  });

  return { create, complete, remove };
}
