import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loadHomeContext,
  persistActiveHome,
  DEFAULT_HOME_SETTINGS,
  type HomeMembership,
  type HomeRole,
  type HomeSettings,
} from "@/shared/services/home.service";
import { qk } from "@/shared/utils/query-keys";
import { STALE } from "@/shared/utils/constants";
import { emit } from "@/automation/bus";

/**
 * Home Context — the definitive owner of "which house is active".
 *
 * Responsibilities: active house, the user's house list, switching houses,
 * persistence (profile + localStorage), automatic refresh after auth changes
 * and cache coordination. Every module consumes the active house from here
 * (usually through `useHome()`), never by querying `home_members` itself.
 *
 * Cache strategy: all module query keys are namespaced by `homeId`, so
 * switching houses swaps the key space and refetches only what is rendered —
 * no blanket invalidation, no reload.
 */

export type HomeContextValue = {
  /** Active house (null while loading or when the user has none yet). */
  home: HomeMembership | null;
  /** Every house the user belongs to. */
  homes: HomeMembership[];
  homeId: string | undefined;
  settings: HomeSettings;
  role: HomeRole | null;
  isAdmin: boolean;
  isOwner: boolean;
  hasHome: boolean;
  isLoading: boolean;
  error: unknown;
  switchHome: (homeId: string) => Promise<void>;
  /** Re-reads memberships + active house (after create/join/leave). */
  refresh: () => Promise<void>;
};

const HomeCtx = createContext<HomeContextValue | null>(null);

export function HomeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [overrideId, setOverrideId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.home.context,
    queryFn: loadHomeContext,
    staleTime: STALE.medium,
  });

  const homes = query.data?.homes ?? [];
  const resolvedId =
    (overrideId && homes.some((h) => h.home_id === overrideId) ? overrideId : null) ??
    query.data?.activeHomeId ??
    homes[0]?.home_id ??
    null;

  const home = homes.find((h) => h.home_id === resolvedId) ?? null;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.home.all });
    await query.refetch();
  }, [queryClient, query]);

  const switchHome = useCallback(
    async (nextId: string) => {
      if (!nextId || nextId === resolvedId) return;
      setOverrideId(nextId);
      await persistActiveHome(nextId);
      queryClient.setQueryData(qk.home.context, (prev: typeof query.data) =>
        prev ? { ...prev, activeHomeId: nextId } : prev,
      );
      // Home-scoped keys carry the homeId, so the new house refetches on its
      // own. Only cross-home caches need an explicit nudge.
      await queryClient.invalidateQueries({ queryKey: qk.invites.all });
      emit({
        type: "home.switched",
        homeId: nextId,
        name: homes.find((h) => h.home_id === nextId)?.home_name ?? "Casa",
      });
    },
    [resolvedId, queryClient, homes, query.data],
  );

  const value = useMemo<HomeContextValue>(() => {
    const role = home?.role ?? null;
    return {
      home,
      homes,
      homeId: home?.home_id,
      settings: home?.settings ?? DEFAULT_HOME_SETTINGS,
      role,
      isAdmin: role === "owner" || role === "admin",
      isOwner: role === "owner",
      hasHome: !!home,
      isLoading: query.isLoading,
      error: query.error,
      switchHome,
      refresh,
    };
  }, [home, homes, query.isLoading, query.error, switchHome, refresh]);

  return <HomeCtx.Provider value={value}>{children}</HomeCtx.Provider>;
}

export function useHomeContext(): HomeContextValue {
  const ctx = useContext(HomeCtx);
  if (!ctx) {
    throw new Error("useHomeContext deve ser usado dentro de <HomeProvider>.");
  }
  return ctx;
}
