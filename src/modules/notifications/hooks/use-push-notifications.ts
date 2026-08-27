import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useHomeContext } from "@/shared/context/HomeContext";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { reportError } from "@/shared/utils/errors";
import {
  base64UrlToUint8Array,
  buildDeviceName,
  ensureNotificationPermission,
  ensureServiceWorkerRegistration,
  getNotificationPermission,
  getPushSupportState,
  getVapidPublicKey,
  isServiceWorkerAllowedHere,

  listHomePushSubscriptions,
  revokePushSubscription,
  savePushSubscription,
  sendTestPushNotification,
  withTimeout,
  type PushSubscriptionRow,
  type PushUiState,
} from "../services/push-notifications.service";

const SCOPE = "Notificações";

function buildUiState(params: {
  support: ReturnType<typeof getPushSupportState>;
  activeSubscription: PushSubscriptionRow | null;
  activeCount: number;
  vapidPublicKey: string | null;
}): PushUiState {
  const permission = getNotificationPermission();

  if (!isServiceWorkerAllowedHere()) {
    return {
      mode: "preview-only",
      title: "Disponível apenas no app publicado",
      description:
        "As notificações push só funcionam na versão publicada do Casa Hub. Abra o app publicado no Safari, adicione-o à tela de início por lá e ative as notificações por dentro do ícone instalado.",
      canActivate: false,
      canDeactivate: !!params.activeSubscription,
      activeCount: params.activeCount,
      deviceLabel: params.activeSubscription?.device_name ?? null,
    };
  }



  if (!params.support.supported) {
    if (params.support.iosStandaloneRequired) {
      return {
        mode: "needs-install",
        title: "Instale como app no iPhone",
        description:
          "No iPhone, notificações push funcionam corretamente quando o Casa Hub está instalado na tela inicial.",
        canActivate: false,
        canDeactivate: !!params.activeSubscription,
        activeCount: params.activeCount,
        deviceLabel: params.activeSubscription?.device_name ?? null,
      };
    }

    return {
      mode: "unsupported",
      title: "Notificações indisponíveis neste dispositivo",
      description: "Seu navegador ou contexto atual não oferece suporte ao fluxo de notificações.",
      canActivate: false,
      canDeactivate: !!params.activeSubscription,
      activeCount: params.activeCount,
      deviceLabel: params.activeSubscription?.device_name ?? null,
    };
  }

  if (!params.vapidPublicKey) {
    return {
      mode: "missing-key",
      title: "Notificações ainda não configuradas",
      description: "A chave pública VAPID não foi configurada no ambiente deste app.",
      canActivate: false,
      canDeactivate: !!params.activeSubscription,
      activeCount: params.activeCount,
      deviceLabel: params.activeSubscription?.device_name ?? null,
    };
  }

  if (permission === "denied") {
    return {
      mode: "blocked",
      title: "Permissão bloqueada no navegador",
      description:
        "No iPhone: Ajustes > Notificações > Casa Hub. No Android/Chrome: toque no cadeado da barra de endereço > Permissões > Notificações.",
      canActivate: false,
      canDeactivate: !!params.activeSubscription,
      activeCount: params.activeCount,
      deviceLabel: params.activeSubscription?.device_name ?? null,
    };
  }

  if (params.activeSubscription) {
    return {
      mode: "enabled",
      title: "Notificações ativadas",
      description:
        params.activeCount > 1
          ? `${params.activeCount} dispositivos estão cadastrados para esta casa.`
          : `Ativado neste dispositivo${params.activeSubscription.device_name ? `: ${params.activeSubscription.device_name}` : ""}.`,
      canActivate: true,
      canDeactivate: true,
      activeCount: params.activeCount,
      deviceLabel: params.activeSubscription.device_name ?? null,
    };
  }

  return {
    mode: "disabled",
    title: "Notificações desativadas",
    description:
      permission === "default"
        ? "Clique para permitir notificações desta casa neste navegador."
        : "Este navegador pode receber notificações, mas elas ainda não foram ativadas para esta casa.",
    canActivate: true,
    canDeactivate: false,
    activeCount: 0,
    deviceLabel: null,
  };
}

export function usePushNotifications() {
  const qc = useQueryClient();
  const { home } = useHomeContext();
  const { data: user } = useAuthUser();
  const homeId = home?.home_id;
  const userId = user?.id;
  const support = useMemo(() => getPushSupportState(), []);
  const vapidPublicKey = useMemo(() => getVapidPublicKey(), []);

  const query = useQuery({
    queryKey: qk.notifications.push(homeId, userId),
    enabled: !!homeId && !!userId,
    queryFn: () => listHomePushSubscriptions(homeId!, userId!),
    staleTime: 30_000,
  });

  const activeSubscriptions = (query.data ?? []).filter((row) => !row.revoked_at);
  const activeSubscription = activeSubscriptions[0] ?? null;

  const state = useMemo(
    () => {
      if (query.isLoading || !homeId || !userId) {
        return {
          mode: "loading" as const,
          title: "Verificando notificações",
          description: "Estamos checando o suporte do navegador e a inscrição atual desta casa.",
          canActivate: false,
          canDeactivate: false,
          activeCount: 0,
          deviceLabel: null,
        };
      }

      return buildUiState({
        support,
        activeSubscription,
        activeCount: activeSubscriptions.length,
        vapidPublicKey,
      });
    },
    [query.isLoading, support, activeSubscription, activeSubscriptions.length, vapidPublicKey, homeId, userId],
  );

  const activate = useMutation({
    mutationFn: async () => {
      if (!homeId) throw new Error("Não encontrei uma casa ativa.");
      if (!userId) throw new Error("Faça login novamente para continuar.");
      if (!support.supported) throw new Error("Seu navegador não oferece suporte ao fluxo de notificações.");
      if (!vapidPublicKey) throw new Error("A chave pública VAPID ainda não foi configurada.");

      // A permissão já foi pedida no clique (gesto do usuário); aqui só validamos.
      const permission = getNotificationPermission();
      if (permission !== "granted") {
        throw new Error(
          permission === "denied"
            ? "A permissão de notificações está bloqueada. Libere em Ajustes > Notificações > Casa Hub (iPhone) ou nas permissões do site no Chrome (Android)."
            : "A permissão para notificações não foi concedida.",
        );
      }

      const registration = await ensureServiceWorkerRegistration();

      let subscription = await withTimeout(
        registration.pushManager.getSubscription(),
        15_000,
        "Não consegui consultar a inscrição de push deste dispositivo.",
      );

      if (!subscription) {
        subscription = await withTimeout(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
          }),
          25_000,
          "O serviço de push do dispositivo não respondeu. Feche e reabra o app instalado e tente novamente.",
        );
      }

      return withTimeout(
        savePushSubscription({
          data: {
            homeId,
            deviceName: buildDeviceName(),
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            subscription: {
              endpoint: subscription.endpoint,
              p256dh: encodeKey(subscription.getKey("p256dh")),
              auth: encodeKey(subscription.getKey("auth")),
            },
          },
        }),
        25_000,
        "O servidor demorou demais para salvar a inscrição. Verifique sua conexão e tente novamente.",
      );
    },
    onSuccess: () => {
      toast.success("Notificações ativadas neste dispositivo.");
      // fire-and-forget: não manter a mutation pendente por causa do refetch
      void qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
    onError: (error) => reportError(SCOPE, error, "Não consegui ativar as notificações."),
  });


  const deactivate = useMutation({
    mutationFn: async () => {
      if (!homeId) throw new Error("Não encontrei uma casa ativa.");
      if (!userId) throw new Error("Faça login novamente para continuar.");

      let endpoint = activeSubscription?.endpoint ?? null;

      if (support.serviceWorker && typeof navigator !== "undefined") {
        try {
          const registration = await navigator.serviceWorker.ready;
          const browserSubscription = await registration.pushManager.getSubscription();
          if (browserSubscription) {
            endpoint = browserSubscription.endpoint;
            try {
              await browserSubscription.unsubscribe();
            } catch {
              /* unsubscribe pode falhar; a revogação no backend ainda será feita */
            }
          }
        } catch {
          /* segue para a revogação no backend */
        }
      }

      if (!endpoint) {
        throw new Error("Não encontrei uma inscrição ativa para desativar.");
      }

      return revokePushSubscription({
        data: { homeId, endpoint },
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
    onError: (error) => reportError(SCOPE, error, "Não consegui desativar as notificações."),
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      if (!homeId) throw new Error("Não encontrei uma casa ativa.");
      if (!activeSubscription) {
        throw new Error("Ative as notificações neste dispositivo antes de enviar o teste.");
      }
      return sendTestPushNotification({ data: { homeId } });
    },
    onSuccess: () => {
      toast.success("Notificação de teste enviada. Confira o aparelho.");
    },
    onError: (error) => reportError(SCOPE, error, "Não consegui enviar a notificação de teste."),
  });

  /**
   * Deve ser chamada direto no onClick: o iOS exige que Notification.requestPermission()
   * ocorra dentro do gesto do usuário, antes de qualquer await do React Query.
   */
  const requestPermissionAndActivate = () => {
    let permissionPromise: Promise<NotificationPermission>;
    try {
      permissionPromise = ensureNotificationPermission();
    } catch (error) {
      reportError(SCOPE, error, "Não consegui ativar as notificações.");
      return;
    }
    permissionPromise
      .then((permission) => {
        if (permission !== "granted") {
          throw new Error(
            permission === "denied"
              ? "A permissão de notificações está bloqueada. Libere em Ajustes > Notificações > Casa Hub (iPhone) ou nas permissões do site no Chrome (Android)."
              : "A permissão para notificações não foi concedida.",
          );
        }
        activate.mutate();
      })
      .catch((error) => reportError(SCOPE, error, "Não consegui ativar as notificações."));
  };

  return {
    query,
    support,
    state,
    vapidPublicKey,
    activate,
    requestPermissionAndActivate,
    deactivate,
    sendTest,
  };
}


function encodeKey(value: ArrayBuffer | null): string {
  if (!value) throw new Error("A inscrição não trouxe a chave esperada.");
  return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}
