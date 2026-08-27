import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import { emit } from "@/automation/bus";
import {
  applyOptimistic,
  patchItem,
  removeItem,
  rollbackOptimistic,
  type OptimisticSnapshot,
} from "@/shared/utils/optimistic";
import type { Event } from "@/shared/types";
import * as service from "../services/calendar.service";

const SCOPE = "Calendário";

export function useUpcomingEvents() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.calendar.upcoming(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listUpcomingEvents(homeId!),
  });
}

export function useEventMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.calendar.all });
    qc.invalidateQueries({ queryKey: qk.dashboard.all });
  };
  const eventKeys = () => [qk.calendar.upcoming(homeId), qk.calendar.list(homeId)];

  const create = useMutation({
    mutationFn: async (input: service.CreateEventInput) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createEvent(homeId, userId, input);
    },
    onSuccess: (created) => {
      invalidate();
      if (homeId && created) {
        emit({
          type: "event.created",
          homeId,
          eventId: created.id,
          title: created.title,
          category: created.category ?? null,
          startAt: created.start_at,
        });
      }
    },
    onError: (e) => reportError(SCOPE, e, "Erro ao criar evento."),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: service.UpdateEventInput }) =>
      service.updateEvent(id, patch),
    onMutate: ({ id, patch }) =>
      applyOptimistic<Event[]>(qc, eventKeys(), patchItem<Event>(id, patch as Partial<Event>)),
    onError: (e, _vars, ctx) => {
      rollbackOptimistic(qc, ctx as OptimisticSnapshot);
      reportError(SCOPE, e, "Erro ao atualizar compromisso.");
    },
    onSettled: () => invalidate(),
  });

  /** Próxima ocorrência de um compromisso recorrente (ação explícita). */
  const createNext = useMutation({
    mutationFn: async (
      event: Parameters<typeof service.createNextEventOccurrence>[2],
    ) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createNextEventOccurrence(homeId!, userId, event);
    },
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e, "Erro ao criar a próxima ocorrência."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteEvent(id),
    onMutate: (id) => applyOptimistic<Event[]>(qc, eventKeys(), removeItem<Event>(id)),
    onError: (e, _vars, ctx) => {
      rollbackOptimistic(qc, ctx as OptimisticSnapshot);
      reportError(SCOPE, e, "Erro ao remover compromisso.");
    },
    onSettled: () => invalidate(),
  });

  return { create, update, createNext, remove };
}
