import { useQuery } from "@tanstack/react-query";
import { useHome } from "./useHome";
import { qk } from "@/shared/utils/query-keys";
import { STALE, OWNER_COLORS } from "@/shared/utils/constants";
import { fetchHomeMembers } from "@/shared/services/members.service";

export function useHomeMembers() {
  const { data: home } = useHome();
  const homeId = home?.home_id;

  const query = useQuery({
    queryKey: qk.members.list(homeId),
    enabled: !!homeId,
    staleTime: STALE.medium,
    queryFn: () => fetchHomeMembers(homeId!),
  });

  const members = query.data ?? [];

  const nameFor = (userId: string | null): string =>
    !userId ? "Compartilhado" : (members.find((m) => m.user_id === userId)?.name ?? "Morador");

  const colorFor = (userId: string | null): string => {
    if (!userId) return "bg-sage-400";
    const idx = members.findIndex((m) => m.user_id === userId);
    return OWNER_COLORS[Math.max(0, idx) % OWNER_COLORS.length];
  };

  return { ...query, members, nameFor, colorFor };
}
