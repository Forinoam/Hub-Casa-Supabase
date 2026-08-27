/**
 * Regras de negócio de compromissos — puras e testáveis, sem React.
 */
import type { Event } from "@/shared/types";
import { EVENT_REMINDERS } from "@/shared/utils/constants";

export type EventFilter = "all" | "mine" | "shared" | (string & {});

export const EventModel = {
  isPersonal(e: Pick<Event, "visibility">): boolean {
    return e.visibility === "personal";
  },
  isDone(e: Pick<Event, "status">): boolean {
    return e.status === "done";
  },
  isCancelled(e: Pick<Event, "status">): boolean {
    return e.status === "cancelled";
  },
  isPast(e: Pick<Event, "start_at">, now: number = Date.now()): boolean {
    return new Date(e.start_at).getTime() < now;
  },
  /** Momento em que o lembrete deve disparar (null = sem lembrete). */
  reminderAt(e: Pick<Event, "start_at" | "reminder_minutes">): Date | null {
    if (e.reminder_minutes === null || e.reminder_minutes === undefined) return null;
    return new Date(new Date(e.start_at).getTime() - e.reminder_minutes * 60_000);
  },
  /** O lembrete já venceu e ainda deve ser enviado? */
  isReminderDue(
    e: Pick<Event, "start_at" | "reminder_minutes" | "status">,
    now: Date = new Date(),
  ): boolean {
    if (e.status !== "pending") return false;
    const at = EventModel.reminderAt(e);
    return !!at && at.getTime() <= now.getTime();
  },
  reminderLabel(min: number | null | undefined): string | null {
    if (min === null || min === undefined) return null;
    return EVENT_REMINDERS.find((r) => r.value === String(min))?.label ?? `${min} min antes`;
  },
};

/** Aplica o filtro de topo da agenda (todos / meus / da casa / morador). */
export function filterEvents<T extends Pick<Event, "status" | "visibility" | "assigned_to">>(
  events: T[],
  filter: EventFilter,
  userId?: string,
): T[] {
  return events.filter((e) => {
    if (e.status === "cancelled") return false;
    if (filter === "all") return true;
    if (filter === "mine") return e.visibility === "personal" || e.assigned_to === userId;
    if (filter === "shared") return e.visibility === "shared";
    return e.assigned_to === filter;
  });
}

/** Separa pendentes de realizados preservando a ordem original. */
export function splitEvents<T extends Pick<Event, "status">>(events: T[]) {
  return {
    pending: events.filter((e) => e.status !== "done"),
    done: events.filter((e) => e.status === "done"),
  };
}

/** Converte ISO → valor aceito por <input type="datetime-local"> no fuso local. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
