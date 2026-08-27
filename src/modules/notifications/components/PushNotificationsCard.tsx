import { Bell } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";
import { primaryButtonClass } from "@/shared/components/form-fields";
import { usePushNotifications } from "../hooks/use-push-notifications";

export function PushNotificationsCard() {
  const { state, activate, requestPermissionAndActivate, deactivate, sendTest } = usePushNotifications();


  return (
    <CardBlock>
      <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">Notificações</p>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-9 place-items-center rounded-full bg-sage-100 text-sage-800">
          <Bell className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-sage-800">{state.title}</p>
          <p className="text-sm text-sage-800/70">{state.description}</p>
          {state.deviceLabel && <p className="mt-2 text-xs text-sage-800/50">{state.deviceLabel}</p>}
          {state.activeCount > 1 && (
            <p className="mt-1 text-xs text-sage-800/50">{state.activeCount} dispositivos ativos</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {state.canActivate && (
              <button
                type="button"
                disabled={activate.isPending}
                onClick={() => requestPermissionAndActivate()}
                className={primaryButtonClass()}
              >
                {activate.isPending ? "Ativando..." : "Ativar notificações"}
              </button>
            )}
            {state.canDeactivate && (
              <button
                type="button"
                disabled={deactivate.isPending}
                onClick={() => deactivate.mutate()}
                className="rounded-full bg-white px-4 py-3 text-sm font-medium text-sage-800 ring-1 ring-black/5 disabled:opacity-60"
              >
                {deactivate.isPending ? "Desativando..." : "Desativar notificações"}
              </button>
            )}
            {state.mode === "enabled" && (
              <button
                type="button"
                disabled={sendTest.isPending}
                onClick={() => sendTest.mutate()}
                className="rounded-full bg-white px-4 py-3 text-sm font-medium text-sage-800 ring-1 ring-black/5 disabled:opacity-60"
              >
                {sendTest.isPending ? "Enviando teste..." : "Enviar notificação de teste"}
              </button>
            )}

          </div>
        </div>
      </div>
    </CardBlock>
  );
}
