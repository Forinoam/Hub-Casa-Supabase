import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentHome } from "@/modules/family";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // A própria tela de onboarding não deve exigir que o usuário já tenha casa,
    // senão criamos um loop de redirecionamento.
    if (location.pathname === "/onboarding") {
      return { user: data.user, home: null };
    }

    try {
      const home = await getCurrentHome();
      if (!home) {
        throw redirect({ to: "/onboarding" });
      }
      return { user: data.user, home };
    } catch (err) {
      if (isRedirect(err)) throw err;
      // Erro real (rede, permissão, etc.) — não escondê-lo tratando como "sem casa".
      throw err;
    }
  },
  component: () => <Outlet />,
});
