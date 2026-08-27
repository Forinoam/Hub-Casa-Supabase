import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/shared/utils/head";
import { AppShell } from "@/shared/components/AppShell";
import { EmptyState } from "@/shared/components/EmptyState";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { RoundIconButton } from "@/shared/components/RoundIconButton";
import { primaryButtonClass } from "@/shared/components/form-fields";
import { useUpcomingEvents, useEventMutations } from "@/modules/calendar";
import {
  filterEvents,
  splitEvents,
  type EventFilter,
} from "@/modules/calendar/models/event.model";
import { EventFilters } from "@/modules/calendar/components/EventFilters";
import { EventCard, DoneEventRow } from "@/modules/calendar/components/EventCard";
import { EventForm } from "@/modules/calendar/components/EventForm";
import { RescheduleForm } from "@/modules/calendar/components/RescheduleForm";
import { useHomeMembers } from "@/shared/hooks/useHomeMembers";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { recurrenceLabel, isRecurring } from "@/shared/utils/recurrence";
import type { Event as CalendarEventType } from "@/shared/types";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () =>
    pageHead({
      title: "Agenda da casa — Casa Hub",
      description:
        "Compromissos pessoais e compartilhados da casa, com responsáveis, lembretes e recorrência.",
      path: "/calendario",
      noindex: true,
    }),
  component: CalendarPage,
});

function CalendarPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEventType | null>(null);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [rescheduling, setRescheduling] = useState<CalendarEventType | null>(null);
  const [nextOccurrence, setNextOccurrence] = useState<CalendarEventType | null>(null);

  const { data: user } = useAuthUser();
  const { members, nameFor, colorFor } = useHomeMembers();
  const { data: events = [] } = useUpcomingEvents();
  const { create, update, createNext, remove } = useEventMutations();

  const { pending, done } = useMemo(
    () => splitEvents(filterEvents(events, filter, user?.id)),
    [events, filter, user?.id],
  );

  const closeSheet = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <AppShell
      subtitle="Próximos compromissos"
      title="Agenda"
      action={
        <RoundIconButton
          icon="plus"
          label="Novo compromisso"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        />
      }
    >
      <EventFilters value={filter} onChange={setFilter} members={members} />

      {pending.length === 0 && done.length === 0 ? (
        <EmptyState message="Nada agendado. Adicione um compromisso." />
      ) : (
        <ul className="space-y-3">
          {pending.map((e) => (
            <li key={e.id} id={`item-${e.id}`}>
              <EventCard
                event={e}
                nameFor={nameFor}
                colorFor={colorFor}
                onEdit={(ev) => {
                  setEditing(ev);
                  setOpen(true);
                }}
                onRemove={(id) => remove.mutate(id)}
                onDone={async (ev) => {
                  await update.mutateAsync({ id: ev.id, patch: { status: "done" } });
                  if (isRecurring(ev.recurrence)) setNextOccurrence(ev);
                }}
                onReschedule={(ev) => setRescheduling(ev)}
                onCancel={(ev) => update.mutate({ id: ev.id, patch: { status: "cancelled" } })}
              />
            </li>
          ))}

          {done.length > 0 && (
            <li className="pt-2">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-sage-800/40">
                Realizados
              </p>
              <ul className="space-y-2">
                {done.map((e) => (
                  <DoneEventRow key={e.id} event={e} onRemove={(id) => remove.mutate(id)} />
                ))}
              </ul>
            </li>
          )}
        </ul>
      )}

      <BottomSheet
        open={open}
        onClose={closeSheet}
        title={editing ? "Editar compromisso" : "Novo compromisso"}
      >
        <EventForm
          editing={editing}
          members={members}
          pending={create.isPending || update.isPending}
          onSubmit={async (payload) => {
            if (editing) {
              await update.mutateAsync({ id: editing.id, patch: payload });
              toast.success("Compromisso atualizado");
            } else {
              await create.mutateAsync(payload);
              toast.success("Compromisso agendado");
            }
            closeSheet();
          }}
        />
      </BottomSheet>

      <BottomSheet
        open={!!rescheduling}
        onClose={() => setRescheduling(null)}
        title="Reagendar compromisso"
      >
        {rescheduling && (
          <RescheduleForm
            startAt={rescheduling.start_at}
            pending={update.isPending}
            onSubmit={async (value) => {
              await update.mutateAsync({
                id: rescheduling.id,
                patch: { start_at: value, status: "pending" },
              });
              toast.success("Compromisso reagendado");
              setRescheduling(null);
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={!!nextOccurrence}
        onClose={() => setNextOccurrence(null)}
        title="Criar a próxima ocorrência?"
      >
        {nextOccurrence && (
          <div className="space-y-3">
            <p className="text-sm text-sage-800/70">
              “{nextOccurrence.title}” se repete{" "}
              {(recurrenceLabel(nextOccurrence.recurrence) ?? "").toLowerCase()}. Quer já deixar o
              próximo agendado?
            </p>
            <button
              className={primaryButtonClass()}
              disabled={createNext.isPending}
              onClick={async () => {
                await createNext.mutateAsync(nextOccurrence);
                toast.success("Próximo compromisso agendado");
                setNextOccurrence(null);
              }}
            >
              {createNext.isPending ? "Agendando..." : "Sim, agendar próximo"}
            </button>
            <button
              className="w-full rounded-full px-4 py-3 text-sm text-sage-800/60"
              onClick={() => setNextOccurrence(null)}
            >
              Agora não
            </button>
          </div>
        )}
      </BottomSheet>
    </AppShell>
  );
}
