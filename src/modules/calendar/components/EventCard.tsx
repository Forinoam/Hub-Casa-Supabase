import type { ReactNode } from "react";
import { CardBlock } from "@/components/ui/card-block";
import { PriorityBadge } from "@/shared/components/RecurrenceField";
import { formatTime } from "@/shared/utils/format";
import { recurrenceLabel } from "@/shared/utils/recurrence";
import { X, Lock, Users, Bell, Check, CalendarClock, Pencil, Repeat } from "lucide-react";
import type { Event as CalendarEventType } from "@/shared/types";
import { EventModel } from "../models/event.model";

function Tag({ icon: Icon, children }: { icon: typeof Lock; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-medium text-sage-800/70">
      <Icon className="size-2.5" /> {children}
    </span>
  );
}

function ActionChip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-xs font-medium text-sage-800 transition hover:bg-sage-800 hover:text-sage-50"
    >
      {children}
    </button>
  );
}

export function EventCard({
  event,
  nameFor,
  colorFor,
  onEdit,
  onRemove,
  onDone,
  onReschedule,
  onCancel,
}: {
  event: CalendarEventType;
  nameFor: (userId: string | null) => string;
  colorFor: (userId: string | null) => string;
  onEdit: (e: CalendarEventType) => void;
  onRemove: (id: string) => void;
  onDone: (e: CalendarEventType) => void;
  onReschedule: (e: CalendarEventType) => void;
  onCancel: (e: CalendarEventType) => void;
}) {
  const d = new Date(event.start_at);
  const isPast = EventModel.isPast(event);
  const personal = EventModel.isPersonal(event);
  const reminder = EventModel.reminderLabel(event.reminder_minutes);

  return (
    <CardBlock className={`p-4 ${isPast ? "ring-clay-600/25" : ""}`}>
      <div className="flex items-center gap-4">
        <div
          className={`grid size-14 shrink-0 place-items-center rounded-2xl text-center ${
            isPast ? "bg-clay-600/12 text-clay-600" : "bg-sage-100"
          }`}
        >
          <div>
            <div className="text-lg font-bold leading-none">{d.getDate()}</div>
            <div className="mt-0.5 text-[10px] uppercase opacity-70">
              {d.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${colorFor(event.assigned_to)}`} />
            <p className="truncate text-sm font-semibold">{event.title}</p>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(event)}
                aria-label="Editar compromisso"
                className="text-sage-800/30 hover:text-sage-800"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(event.id)}
                aria-label="Remover compromisso"
                className="text-sage-800/30 hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-sage-800/60">
            {formatTime(d)} • {personal ? "Só para você" : nameFor(event.assigned_to)} • {event.category}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <PriorityBadge value={event.priority} />
            <Tag icon={personal ? Lock : Users}>{personal ? "Pessoal" : "Compartilhado"}</Tag>
            {reminder && <Tag icon={Bell}>{reminder}</Tag>}
            {recurrenceLabel(event.recurrence) && (
              <Tag icon={Repeat}>{recurrenceLabel(event.recurrence)}</Tag>
            )}
          </div>
        </div>
      </div>

      {isPast && (
        <div className="mt-3 border-t border-black/5 pt-3">
          <p className="mb-2 text-xs text-clay-600">Este compromisso já passou. Foi realizado?</p>
          <div className="flex flex-wrap gap-2">
            <ActionChip onClick={() => onDone(event)}>
              <Check className="size-3" /> Realizado
            </ActionChip>
            <ActionChip onClick={() => onReschedule(event)}>
              <CalendarClock className="size-3" /> Reagendar
            </ActionChip>
            <ActionChip onClick={() => onCancel(event)}>
              <X className="size-3" /> Cancelar
            </ActionChip>
          </div>
        </div>
      )}
    </CardBlock>
  );
}

export function DoneEventRow({
  event,
  onRemove,
}: {
  event: CalendarEventType;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-2xl bg-white/60 px-4 py-3 text-sm text-sage-800/50 ring-1 ring-black/5">
      <Check className="size-4 shrink-0 text-sage-800/40" />
      <span className="truncate line-through">{event.title}</span>
      <button
        type="button"
        onClick={() => onRemove(event.id)}
        aria-label="Excluir compromisso concluído"
        className="ml-auto text-sage-800/30 hover:text-destructive"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
