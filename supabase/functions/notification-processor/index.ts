import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWebPush, type VapidKeys } from "./webpush.ts";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
};

type DueReminderRow = {
  source_type: string;
  source_id: string;
  home_id: string;
  recipient_user_id: string;
  scheduled_for: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
};

type PushSubscriptionRow = {
  id: string;
  home_id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type DeliveryRow = {
  id: string;
  dedupe_key: string;
  home_id: string;
  source_type: string;
  source_id: string;
  recipient_user_id: string;
  subscription_id: string;
  scheduled_for: string;
  status: string;
  payload: Record<string, unknown>;
};

const SUBSCRIPTION_SELECT = "id, home_id, user_id, endpoint, p256dh, auth";

function getEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name)?.trim() || undefined;
}

function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function readVapid(): VapidKeys {
  return {
    publicKey: requireEnv("VAPID_PUBLIC_KEY"),
    privateKey: requireEnv("VAPID_PRIVATE_KEY"),
    subject: getEnv("VAPID_SUBJECT") ?? "mailto:casa-hub@example.com",
  };
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return header?.trim() || null;
  return header.slice(7).trim();
}

const SOURCE_URLS: Record<string, string> = {
  event: "/calendario",
  task: "/tarefas",
  bill: "/financeiro",
  maintenance: "/manutencao",
  shopping: "/compras",
  budget: "/financeiro",
};

const SOURCE_TITLES: Record<string, string> = {
  event: "Compromisso",
  task: "Tarefa da casa",
  bill: "Conta a pagar",
  maintenance: "Manutenção",
  shopping: "Lista de compras",
  budget: "Orçamento",
};

function buildNotificationPayload(input: {
  type: string;
  sourceId: string;
  homeId: string;
  body: string;
  title?: string;
  url?: string;
  extra?: Record<string, unknown>;
}) {
  return {
    type: input.type,
    sourceId: input.sourceId,
    homeId: input.homeId,
    title: input.title ?? "Casa Hub",
    body: input.body,
    url: input.url ?? "/calendario",
    ...(input.extra ?? {}),
  };
}


type Supa = ReturnType<typeof createClient>;

/**
 * Envia as entregas já "reivindicadas" (linhas realmente inseridas em
 * notification_deliveries) e atualiza status/erro. Subscriptions removidas
 * pelo serviço de push (404/410) são revogadas; erros temporários não.
 */
async function dispatchDeliveries(
  supabase: Supa,
  deliveries: DeliveryRow[],
  subscriptions: Map<string, PushSubscriptionRow>,
  vapid: VapidKeys,
): Promise<{ sent: number; failed: number; revoked: number }> {
  let sent = 0;
  let failed = 0;
  let revoked = 0;

  for (const delivery of deliveries) {
    const subscription = subscriptions.get(delivery.subscription_id);
    if (!subscription) {
      failed += 1;
      await supabase
        .from("notification_deliveries")
        .update({ status: "failed", error: "Inscrição não encontrada.", attempt_count: 1 })
        .eq("id", delivery.id);
      continue;
    }

    const result = await sendWebPush(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      delivery.payload,
      vapid,
      // 24h de validade: no Android o aparelho pode estar em Doze/sem rede por horas.
      86_400,
      delivery.source_type === "test" ? "normal" : "high",
    );

    if (result.ok) {
      sent += 1;
      await supabase
        .from("notification_deliveries")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null, attempt_count: 1 })
        .eq("id", delivery.id);
      await supabase
        .from("push_subscriptions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", subscription.id);
      continue;
    }

    failed += 1;
    await supabase
      .from("notification_deliveries")
      .update({
        status: result.gone ? "expired" : "failed",
        error: result.error ?? `HTTP ${result.status}`,
        attempt_count: 1,
      })
      .eq("id", delivery.id);

    if (result.gone) {
      revoked += 1;
      await supabase
        .from("push_subscriptions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", subscription.id)
        .is("revoked_at", null);
    }
  }

  return { sent, failed, revoked };
}

async function processReminders(supabase: Supa, vapid: VapidKeys) {
  const { data: dueReminders, error: remindersError } = await supabase.rpc(
    "list_due_event_reminders",
    { _limit: 200 },
  );
  if (remindersError) throw remindersError;

  const reminders = (dueReminders ?? []) as DueReminderRow[];
  if (reminders.length === 0) {
    return { ok: true, reminders: 0, queued: 0, sent: 0, failed: 0, revoked: 0 };
  }

  const homeIds = [...new Set(reminders.map((row) => row.home_id))];
  const userIds = [...new Set(reminders.map((row) => row.recipient_user_id))];

  const { data: subscriptionsData, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select(SUBSCRIPTION_SELECT)
    .is("revoked_at", null)
    .in("home_id", homeIds)
    .in("user_id", userIds);
  if (subscriptionsError) throw subscriptionsError;

  const subscriptions = (subscriptionsData ?? []) as unknown as PushSubscriptionRow[];
  const byRecipient = new Map<string, PushSubscriptionRow[]>();
  const byId = new Map<string, PushSubscriptionRow>();
  for (const subscription of subscriptions) {
    byId.set(subscription.id, subscription);
    const key = `${subscription.home_id}:${subscription.user_id}`;
    byRecipient.set(key, [...(byRecipient.get(key) ?? []), subscription]);
  }

  const rows = reminders.flatMap((reminder) =>
    (byRecipient.get(`${reminder.home_id}:${reminder.recipient_user_id}`) ?? []).map((subscription) => ({
      dedupe_key: [subscription.id, reminder.source_type, reminder.source_id, reminder.scheduled_for].join(":"),
      home_id: reminder.home_id,
      source_type: reminder.source_type,
      source_id: reminder.source_id,
      recipient_user_id: reminder.recipient_user_id,
      subscription_id: subscription.id,
      scheduled_for: reminder.scheduled_for,
      status: "queued",
      payload: buildNotificationPayload({
        type: `${reminder.source_type}_reminder`,
        sourceId: reminder.source_id,
        homeId: reminder.home_id,
        title: SOURCE_TITLES[reminder.source_type] ?? "Casa Hub",
        body: reminder.title,
        url:
          (typeof reminder.payload?.url === "string" ? (reminder.payload.url as string) : undefined) ??
          SOURCE_URLS[reminder.source_type] ??
          "/calendario",
        extra: { detail: reminder.body, scheduledFor: reminder.scheduled_for },
      }),

    })),
  );

  if (rows.length === 0) {
    return { ok: true, reminders: reminders.length, queued: 0, sent: 0, failed: 0, revoked: 0 };
  }

  // INSERT ... ON CONFLICT (dedupe_key) DO NOTHING RETURNING *:
  // só voltam as linhas realmente criadas por ESTA execução, o que impede
  // que duas execuções simultâneas enviem a mesma notificação.
  const { data: claimed, error: claimError } = await supabase
    .from("notification_deliveries")
    .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true })
    .select("id, dedupe_key, home_id, source_type, source_id, recipient_user_id, subscription_id, scheduled_for, status, payload");
  if (claimError) throw claimError;

  const deliveries = (claimed ?? []) as unknown as DeliveryRow[];
  const dispatched = await dispatchDeliveries(supabase, deliveries, byId, vapid);

  return {
    ok: true,
    reminders: reminders.length,
    queued: deliveries.length,
    ...dispatched,
  };
}

async function processTest(supabase: Supa, vapid: VapidKeys, userId: string, homeId: string | null) {
  let query = supabase
    .from("push_subscriptions")
    .select(SUBSCRIPTION_SELECT)
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (homeId) query = query.eq("home_id", homeId);

  const { data, error } = await query;
  if (error) throw error;

  const subscriptions = (data ?? []) as unknown as PushSubscriptionRow[];
  if (subscriptions.length === 0) {
    return { ok: false, reason: "no-subscription", sent: 0, failed: 0, revoked: 0 };
  }

  const stamp = new Date().toISOString();
  const rows = subscriptions.map((subscription) => ({
    dedupe_key: `${subscription.id}:test:${stamp}`,
    home_id: subscription.home_id,
    source_type: "test",
    source_id: subscription.id,
    recipient_user_id: userId,
    subscription_id: subscription.id,
    scheduled_for: stamp,
    status: "queued",
    payload: buildNotificationPayload({
      type: "test_notification",
      sourceId: subscription.id,
      homeId: subscription.home_id,
      body: "Notificação de teste: está tudo funcionando.",
      url: "/configuracoes",
    }),
  }));

  const { data: claimed, error: claimError } = await supabase
    .from("notification_deliveries")
    .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true })
    .select("id, dedupe_key, home_id, source_type, source_id, recipient_user_id, subscription_id, scheduled_for, status, payload");
  if (claimError) throw claimError;

  const byId = new Map(subscriptions.map((subscription) => [subscription.id, subscription]));
  const dispatched = await dispatchDeliveries(
    supabase,
    (claimed ?? []) as unknown as DeliveryRow[],
    byId,
    vapid,
  );

  return { ok: dispatched.sent > 0, reason: dispatched.sent > 0 ? null : "send-failed", ...dispatched };
}

async function resolveUserFromToken(
  supabaseUrl: string,
  anonKey: string | undefined,
  token: string,
): Promise<string | null> {
  if (!anonKey) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  });
  if (!response.ok) return null;
  const user = (await response.json().catch(() => null)) as { id?: string } | null;
  return user?.id ?? null;
}

async function main(request: Request): Promise<Response> {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  const token = bearerToken(request);

  const isServiceRole = !!token && token === serviceRoleKey;
  const isKnownCaller = isServiceRole || (!!token && !!anonKey && token === anonKey);


  let body: { mode?: string; userId?: string; homeId?: string } = {};
  if (request.method === "POST") {
    body = await request.json().catch(() => ({}));
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const vapid = readVapid();

  if (body.mode === "test") {
    // O teste é autorizado pelo JWT do usuário logado (ou pela service role, que
    // precisa informar o userId). Assim não dependemos de duas cópias iguais da
    // chave secreta entre o app e esta função.
    let targetUserId: string | null = null;

    if (isServiceRole) {
      targetUserId = body.userId ?? null;
    } else if (token) {
      targetUserId = await resolveUserFromToken(supabaseUrl, anonKey, token);
    }

    if (!targetUserId) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const result = await processTest(supabase, vapid, targetUserId, body.homeId ?? null);
    console.info("[notification-processor] test push", result);
    return Response.json(result);
  }


  if (!isKnownCaller) {
    console.warn("[notification-processor] reminder run triggered by an unrecognized caller");
  }
  const result = await processReminders(supabase, vapid);

  console.info("[notification-processor] reminders processed", result);
  return Response.json(result);
}

export default {
  async fetch(request: Request) {
    try {
      return await main(request);
    } catch (error) {
      console.error("[notification-processor] failed", error);
      return Response.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Falha ao processar notificações.",
        },
        { status: 500 },
      );
    }
  },
};
