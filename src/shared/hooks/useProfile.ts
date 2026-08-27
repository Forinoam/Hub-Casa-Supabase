import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/shared/utils/query-keys";
import { STALE } from "@/shared/utils/constants";

export function useProfile() {
  return useQuery({
    queryKey: qk.profile.me,
    staleTime: STALE.medium,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", userData.user.id)
        .maybeSingle();
      return data ?? { id: userData.user.id, display_name: null, avatar_url: null };
    },
  });
}
