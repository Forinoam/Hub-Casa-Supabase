import { useEffect } from "react";

import {
  ensureServiceWorkerRegistration,
  isServiceWorkerAllowedHere,
  unregisterAppServiceWorkers,
} from "@/shared/services/pwa-registration";

export function usePwaRegistration(): void {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (!isServiceWorkerAllowedHere()) {
      void unregisterAppServiceWorkers().catch(() => {
        /* nada a fazer: apenas limpeza de registros antigos */
      });
      return;
    }

    void ensureServiceWorkerRegistration().catch((error) => {
      console.error("[pwa] failed to register service worker", error);
    });
  }, []);
}
