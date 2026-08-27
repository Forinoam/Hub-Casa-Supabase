const APP_SERVICE_WORKER_PATH = "/sw.js";
const SERVICE_WORKER_ACTIVATION_TIMEOUT_MS = 30_000;

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

export function isServiceWorkerAllowedHere(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return false;

  try {
    if (window.self !== window.top) return false;
  } catch {
    return false;
  }

  if (new URL(window.location.href).searchParams.get("sw") === "off") return false;

  const host = window.location.hostname;
  const blocked =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  return !blocked;
}

function isAppServiceWorker(registration: ServiceWorkerRegistration): boolean {
  const scriptUrl =
    registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL ?? "";
  return scriptUrl.endsWith(APP_SERVICE_WORKER_PATH) || scriptUrl.includes("dev-sw.js");
}

export async function unregisterAppServiceWorkers(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.filter(isAppServiceWorker).map((registration) => registration.unregister()));
}

function waitForWorkerActivation(
  registration: ServiceWorkerRegistration,
): Promise<ServiceWorkerRegistration> {
  const worker = registration.installing ?? registration.waiting ?? registration.active;

  if (worker?.state === "activated") return Promise.resolve(registration);
  if (!worker) {
    return Promise.reject(new Error("O Service Worker foi registrado, mas nenhum processo de instalação foi encontrado."));
  }

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("A instalação do Service Worker excedeu o tempo esperado."));
    }, SERVICE_WORKER_ACTIVATION_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      worker.removeEventListener("statechange", handleStateChange);
    };

    const handleStateChange = () => {
      if (worker.state === "activated") {
        cleanup();
        resolve(registration);
      } else if (worker.state === "redundant") {
        cleanup();
        reject(
          new Error(
            "O Service Worker falhou durante a instalação. Atualize o app para carregar a versão corrigida e tente novamente.",
          ),
        );
      }
    };

    worker.addEventListener("statechange", handleStateChange);
    handleStateChange();
  });
}

async function registerAndActivateServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Este navegador não oferece suporte a Service Workers.");
  }
  if (!isServiceWorkerAllowedHere()) {
    throw new Error(
      "As notificações push só funcionam no app publicado. Abra o Casa Hub pelo endereço publicado e instale-o na tela inicial a partir dele.",
    );
  }

  const response = await fetch(APP_SERVICE_WORKER_PATH, { method: "GET", cache: "no-store" }).catch(() => null);
  if (!response?.ok) {
    throw new Error("Não encontrei o Service Worker desta versão do Casa Hub.");
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  const registration = existing ?? (await navigator.serviceWorker.register(APP_SERVICE_WORKER_PATH, { scope: "/" }));

  if (existing) await existing.update();
  return waitForWorkerActivation(registration);
}

export function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!registrationPromise) {
    registrationPromise = registerAndActivateServiceWorker().catch((error) => {
      registrationPromise = null;
      throw error;
    });
  }
  return registrationPromise;
}