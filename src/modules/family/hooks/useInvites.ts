import { useQuery } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { qk } from "@/shared/utils/query-keys";
import { STALE } from "@/shared/utils/constants";
import { listInvites, listMyInvites } from "../services/invites.service";

/** Invites issued by the active house (admin view). */
export function useInvites() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.invites.list(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => listInvites(homeId!),
  });
}

/** Pending invites addressed to the signed-in user. */
export function useMyInvites() {
  return useQuery({
    queryKey: qk.invites.mine,
    staleTime: STALE.short,
    queryFn: listMyInvites,
  });
}
