import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { toUserMessage } from "@/shared/utils/errors";

/** Erros de rede recebem uma mensagem própria — o usuário precisa saber que é conexão. */
function isNetworkError(error: unknown): boolean {
  const msg = toUserMessage(error, "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("network request failed")
  );
}

let lastToastAt = 0;
/** Evita enxurrada de toasts quando várias queries falham juntas. */
function notifyOnce(message: string) {
  const now = Date.now();
  if (now - lastToastAt < 4000) return;
  lastToastAt = now;
  toast.error(message);
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => (isNetworkError(error) ? failureCount < 2 : false),
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (typeof window === "undefined") return;
        if (isNetworkError(error) || !navigator.onLine) {
          notifyOnce("Sem conexão. Vamos tentar de novo assim que a internet voltar.");
          return;
        }
        notifyOnce(toUserMessage(error, "Não consegui carregar seus dados agora."));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (typeof window === "undefined") return;
        // Mutações com onError próprio já mostram a mensagem certa.
        if (mutation.options.onError) return;
        if (isNetworkError(error) || !navigator.onLine) {
          notifyOnce("Sem conexão — a alteração não foi salva. Tente novamente.");
          return;
        }
        notifyOnce(toUserMessage(error, "Não consegui salvar agora."));
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
