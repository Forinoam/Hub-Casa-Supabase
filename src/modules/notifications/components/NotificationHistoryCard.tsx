import { History } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";
import { useNotificationHistory } from "../hooks/use-notification-preferences";
import { SOURCE_LABELS, STATUS_LABELS } from "../services/notification-preferences.service";

function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function statusClass(status: string): string {
  if (status === "sent") return "bg-sage-100 text-sage-800";
  if (status === "failed") return "bg-clay-100 text-clay-700";
  return "bg-sage-50 text-sage-800/70";
}

export function NotificationHistoryCard() {
  const { data, isLoading } = useNotificationHistory();

  return (
    <CardBlock>
      <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">Histórico de avisos</p>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-9 place-items-center rounded-full bg-sage-100 text-sage-800">
          <History className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          {isLoading && <p className="text-sm text-sage-800/60">Carregando envios...</p>}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <p className="text-sm text-sage-800/60">Nenhum aviso enviado até agora.</p>
          )}
          <ul className="space-y-3">
            {(data ?? []).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sage-800">
                    {item.payload?.title ?? SOURCE_LABELS[item.source_type] ?? "Aviso"}
                  </p>
                  <p className="text-xs text-sage-800/60">
                    {SOURCE_LABELS[item.source_type] ?? item.source_type} ·{" "}
                    {formatDateTime(item.sent_at ?? item.scheduled_for)}
                  </p>
                  {item.error && <p className="mt-1 text-xs text-clay-700">{item.error}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusClass(item.status)}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CardBlock>
  );
}
