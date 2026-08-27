import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
export { ensureServiceWorkerRegistration, isServiceWorkerAllowedHere } from "@/shared/services/pwa-registration";

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  home_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_name: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

export type PushSupportState = {
  secureContext: boolean;
  serviceWorker: boolean;
  notifications: boolean;
  pushManager: boolean;
  standalone: boolean;
  iosStandaloneRequired: boolean;
  supported: boolean;
};

export type PushUiState = {
  mode:
    | "loading"
    | "enabled"
    | "disabled"
    | "blocked"
    | "unsupported"
    | "needs-install"
    | "preview-only"
    | "missing-key";
  title: string;
  description: string;
  canActivate: boolean;
  canDeactivate: boolean;
  activeCount: number;
  deviceLabel: string | null;
};


const PUSH_SUBSCRIPTION_SELECT =
  "id, user_id, home_id, endpoint, p256dh, auth, device_name, user_agent, created_at, last_seen_at, revoked_at";

function runtimeEnv(name: string): string | undefined {
  const value = import.meta.env[name as keyof ImportMetaEnv];
  if (typeof value === "string" && value.trim()) return value.trim();
  const fallback = process.env[name];
  return typeof fallback === "string" && fallback.trim() ? fallback.trim() : undefined;
}

function isIPhoneLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function getPushSupportState(): PushSupportState {
  const secureContext = typeof window !== "undefined" ? window.isSecureContext : false;
  const serviceWorker = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const notifications = typeof window !== "undefined" && "Notification" in window;
  const pushManager = typeof window !== "undefined" && "PushManager" in window;
  const standalone = isStandaloneDisplay();
  const iosStandaloneRequired = isIPhoneLike() && !standalone;

  return {
    secureContext,
    serviceWorker,
    notifications,
    pushManager,
    standalone,
    iosStandaloneRequired,
    supported: secureContext && serviceWorker && notifications && pushManager && !iosStandaloneRequired,
  };
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function getVapidPublicKey(): string | null {
  return runtimeEnv("VITE_VAPID_PUBLIC_KEY") ?? null;
}

/** Safari/iOS aceita apenas Uint8Array (ou string) em applicationServerKey. */
export function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; ++index) output[index] = raw.charCodeAt(index);
  return output;
}

/** Nunca deixa uma etapa do fluxo pendurada para sempre. */
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * Deve ser chamada dentro do gesto do usuário (onClick). No iOS/Safari o pedido
 * de permissão fora de um gesto pode ficar pendente para sempre.
 */
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("Este navegador não oferece suporte a notificações.");
  }
  if (Notification.permission !== "default") return Notification.permission;
  return withTimeout(
    Promise.resolve(Notification.requestPermission()),
    20_000,
    "O navegador não respondeu ao pedido de permissão. Tente novamente.",
  );
}

export function encodeSubscriptionKey(value: ArrayBuffer | null): string {
  if (!value) throw new Error("A inscrição não trouxe uma chave válida.");
  return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

export function buildDeviceName(): string {
  if (typeof navigator === "undefined") return "Dispositivo";

  const ua = navigator.userAgent;
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? "Dispositivo";
  const browser = /Edg/i.test(ua)
    ? "Edge"
    : /Firefox/i.test(ua)
      ? "Firefox"
      : /Chrome/i.test(ua) && !/Edg/i.test(ua)
        ? "Chrome"
        : /Safari/i.test(ua) && !/Chrome/i.test(ua)
          ? "Safari"
          : "Navegador";

  return `${platform} · ${browser}`;
}

function buildSubscriptionPayload(subscription: PushSubscription): { endpoint: string; p256dh: string; auth: string } {
  return {
    endpoint: subscription.endpoint,
    p256dh: encodeSubscriptionKey(subscription.getKey("p256dh")),
    auth: encodeSubscriptionKey(subscription.getKey("auth")),
  };
}

async function assertHomeMembership(supabaseClient: typeof supabase, homeId: string, userId: string): Promise<void> {
  const { data, error } = await supabaseClient
    .from("home_members")
    .select("id")
    .eq("home_id", homeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Não encontrei uma casa válida para salvar esta inscrição.");
}


export async function listHomePushSubscriptions(homeId: string, userId: string): Promise<PushSubscriptionRow[]> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select(PUSH_SUBSCRIPTION_SELECT)
    .eq("home_id", homeId)
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PushSubscriptionRow[];
}

const saveSubscriptionSchema = z.object({
  homeId: z.string().uuid(),
  deviceName: z.string().trim().max(120).nullable().optional(),
  userAgent: z.string().trim().max(500).nullable().optional(),
  subscription: z.object({
    endpoint: z.string().min(1),
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const revokeSubscriptionSchema = z.object({
  homeId: z.string().uuid(),
  endpoint: z.string().min(1),
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveSubscriptionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertHomeMembership(supabase, data.homeId, userId);

    const now = new Date().toISOString();
    const payload = {
      user_id: userId,
      home_id: data.homeId,
      endpoint: data.subscription.endpoint,
      p256dh: data.subscription.p256dh,
      auth: data.subscription.auth,
      device_name: data.deviceName ?? buildDeviceName(),
      user_agent: data.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : null),
      last_seen_at: now,
      revoked_at: null,
    };

    const { data: saved, error } = await supabase
      .from("push_subscriptions")
      .upsert(payload, { onConflict: "user_id,home_id,endpoint" })
      .select(PUSH_SUBSCRIPTION_SELECT)
      .single();

    if (error) throw error;
    return saved as PushSubscriptionRow;
  });

export const revokePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => revokeSubscriptionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertHomeMembership(supabase, data.homeId, userId);

    const now = new Date().toISOString();
    const { data: revoked, error } = await supabase
      .from("push_subscriptions")
      .update({ revoked_at: now, last_seen_at: now })
      .eq("user_id", userId)
      .eq("endpoint", data.endpoint)
      .is("revoked_at", null)
      .select(PUSH_SUBSCRIPTION_SELECT);

    if (error) throw error;
    return (revoked ?? []) as PushSubscriptionRow[];
  });

const testPushSchema = z.object({
  homeId: z.string().uuid(),
});

/**
 * Dispara um Web Push REAL (mesmo caminho VAPID usado em produção) apenas para
 * os dispositivos do próprio usuário autenticado. O disparo é feito pela Edge
 * Function notification-processor, que é a única detentora da chave privada.
 */
export const sendTestPushNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => testPushSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertHomeMembership(supabase, data.homeId, userId);

    const supabaseUrl = process.env["SUPABASE_URL"];
    const anonKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!supabaseUrl || !anonKey) {
      throw new Error("O backend de notificações ainda não está configurado.");
    }

    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const authHeader = getRequestHeader("authorization") ?? "";
    const userToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
    if (!userToken) {
      throw new Error("Faça login novamente para enviar a notificação de teste.");
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/notification-processor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "test", homeId: data.homeId }),
    });


    const result = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string | null;
      sent?: number;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result.error ?? "Não consegui enviar a notificação de teste.");
    }
    if (!result.ok) {
      if (result.reason === "no-subscription") {
        throw new Error("Nenhum dispositivo ativo encontrado. Ative as notificações neste aparelho.");
      }
      throw new Error(result.error ?? "O serviço de push recusou o envio da notificação de teste.");
    }

    return { sent: result.sent ?? 0 };
  });
