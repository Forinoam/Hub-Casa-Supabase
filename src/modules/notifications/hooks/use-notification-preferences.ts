import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHomeContext } from "@/shared/context/HomeContext";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { STALE } from "@/shared/utils/constants";
import { reportError } from "@/shared/utils/errors";
import {
  listNotificationHistory,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
  type NotificationPreferencesPatch,
} from "../services/notification-preferences.service";

export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const { homeId } = useHomeContext();
  const { data: user } = useAuthUser();
  const userId = user?.id;
  const key = qk.notifications.preferences(homeId, userId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => loadNotificationPreferences(homeId!, userId!),
    enabled: !!homeId && !!userId,
    staleTime: STALE.medium,
  });

  const update = useMutation({
    mutationFn: (patch: NotificationPreferencesPatch) => {
      if (!query.data) throw new Error("Preferências ainda não carregadas.");
      return saveNotificationPreferences(query.data.id, patch);
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationPreferences>(key);
      if (previous) queryClient.setQueryData(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (error, _patch, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
      reportError("Notificações", error);
    },
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  });

  return { preferences: query.data ?? null, isLoading: query.isLoading, update };
}

export function useNotificationHistory(limit = 12) {
  const { homeId } = useHomeContext();
  return useQuery({
    queryKey: qk.notifications.history(homeId),
    queryFn: () => listNotificationHistory(homeId!, limit),
    enabled: !!homeId,
    staleTime: STALE.short,
  });
}
