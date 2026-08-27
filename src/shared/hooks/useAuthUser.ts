import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, getCurrentUserId } from "@/shared/services/auth.service";
import { STALE } from "@/shared/utils/constants";

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-user"],
    staleTime: STALE.medium,
    queryFn: getCurrentUser,
  });
}

/** Imperative variant for mutation handlers. */
export async function getAuthUserId(): Promise<string> {
  return getCurrentUserId();
}
