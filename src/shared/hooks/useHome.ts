import { useHomeContext } from "@/shared/context/HomeContext";

/**
 * Backwards-compatible accessor for the active house.
 * Shape mirrors a React Query result (`data`) so every existing module keeps
 * working, but the data now comes from the single Home Context.
 */
export function useHome() {
  const ctx = useHomeContext();
  return {
    data: ctx.home,
    isLoading: ctx.isLoading,
    error: ctx.error,
    refetch: ctx.refresh,
  };
}

export { useHomeContext };
