/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

type PushPayload = {
  type?: string;
  sourceId?: string;
  homeId?: string;
  title?: string;
  body?: string;
  url?: string;
};

function readPayload(event: PushEvent): PushPayload {
  if (!event.data) return {};
  try {
    return event.data.json() as PushPayload;
  } catch {
    return { body: event.data.text() };
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  const title = payload.title || "Casa Hub";
  const url = payload.url || "/";

  const tag = payload.type && payload.sourceId ? `${payload.type}:${payload.sourceId}` : undefined;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "Você tem um lembrete no Casa Hub.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag,
      data: { ...payload, url },
      // renotify/vibrate só existem no Android/Chrome; o TS DOM ainda não os declara.
      ...({ renotify: Boolean(tag), vibrate: [120, 60, 120] } as Record<string, unknown>),
    } as NotificationOptions),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = (event.notification.data ?? {}) as PushPayload;
  const targetUrl = new URL(data.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client && client.url !== targetUrl) {
            try {
              await client.navigate(targetUrl);
            } catch {
              /* mantém a janela atual se a navegação for bloqueada */
            }
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});


self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

export {};
