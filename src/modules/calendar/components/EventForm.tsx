import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Lock, Users } from "lucide-react";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import {
  RecurrenceField,
  PriorityField,
  recurrenceToState,
  stateToRecurrence,
  type RecurrenceState,
} from "@/shared/components/RecurrenceField";
import { EVENT_CATEGORIES, EVENT_REMINDERS } from "@/shared/utils/constants";
import type { EventVisibility } from "../services/calendar.service";
import { toLocalInput } from "../models/event.model";
import type { Event as CalendarEventType } from "@/shared/types";

export type EventFormValues = {
  title: string;
  start_at: string;
  category: string;
  assignedTo: string; // "shared" | user_id
  visibility: EventVisibility;
  reminder: string;
  priority: string;
};

export type EventFormPayload = {
  title: string;
  start_at: string;
  category: string;
  assigned_to: string | null;
  visibility: EventVisibility;
  reminder_minutes: number | null;
  priority: string;
  recurrence: ReturnType<typeof stateToRecurrence>;
};

const DEFAULTS: EventFormValues = {
  title: "",
  start_at: "",
  category: "compromisso",
  assignedTo: "shared",
  visibility: "shared",
  reminder: "60",
  priority: "none",
};

function VisibilityOption({
  active,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: typeof Lock;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-2xl px-4 py-3 text-left transition ${
        active ? "bg-sage-800 text-sage-50" : "bg-white text-sage-800 ring-1 ring-black/5"
      }`}
    >
      <Icon className="size-4" />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] opacity-70">{hint}</span>
    </button>
  );
}

export function EventForm({
  editing,
  members,
  pending,
  onSubmit,
}: {
  editing: CalendarEventType | null;
  members: Array<{ user_id: string; name: string }>;
  pending: boolean;
  onSubmit: (payload: EventFormPayload) => Promise<void> | void;
}) {
  const form = useForm<EventFormValues>({ defaultValues: DEFAULTS });
  const [recurrence, setRecurrence] = useState<RecurrenceState>(recurrenceToState(null));
  const visibility = form.watch("visibility");
  const priority = form.watch("priority");

  useEffect(() => {
    if (editing) {
      form.reset({
        title: editing.title,
        start_at: toLocalInput(editing.start_at),
        category: editing.category ?? "compromisso",
        assignedTo: editing.assigned_to ?? "shared",
        visibility: (editing.visibility === "personal" ? "personal" : "shared") as EventVisibility,
        reminder:
          editing.reminder_minutes === null || editing.reminder_minutes === undefined
            ? ""
            : String(editing.reminder_minutes),
        priority: editing.priority ?? "none",
      });
      setRecurrence(recurrenceToState(editing.recurrence));
    } else {
      form.reset(DEFAULTS);
      setRecurrence(recurrenceToState(null));
    }
  }, [editing, form]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      start_at: values.start_at,
      category: values.category,
      assigned_to: values.assignedTo === "shared" ? null : values.assignedTo,
      visibility: values.visibility,
      reminder_minutes: values.reminder === "" ? null : Number(values.reminder),
      priority: values.priority,
      recurrence: stateToRecurrence(recurrence),
    });
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        autoFocus
        placeholder="Título"
        className={fieldClass()}
        {...form.register("title", { required: true })}
      />
      <input
        type="datetime-local"
        className={fieldClass()}
        {...form.register("start_at", { required: true })}
      />

      <div className="grid grid-cols-2 gap-2">
        <VisibilityOption
          active={visibility === "shared"}
          icon={Users}
          label="Da casa"
          hint="Todos veem"
          onClick={() => form.setValue("visibility", "shared")}
        />
        <VisibilityOption
          active={visibility === "personal"}
          icon={Lock}
          label="Pessoal"
          hint="Só você vê"
          onClick={() => form.setValue("visibility", "personal")}
        />
      </div>

      <select className={fieldClass()} {...form.register("category")}>
        {EVENT_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {visibility === "shared" && (
        <select className={fieldClass()} {...form.register("assignedTo")}>
          <option value="shared">Sem responsável</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.name}
            </option>
          ))}
        </select>
      )}

      <PriorityField value={priority} onChange={(v) => form.setValue("priority", v)} />

      <RecurrenceField value={recurrence} onChange={setRecurrence} />

      <div className="space-y-2">
        <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">
          Lembrete
        </label>
        <select className={fieldClass()} {...form.register("reminder")}>
          {EVENT_REMINDERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!form.watch("title") || !form.watch("start_at") || pending}
        className={primaryButtonClass()}
      >
        {editing ? (pending ? "Salvando..." : "Salvar alterações") : pending ? "Agendando..." : "Agendar"}
      </button>
    </form>
  );
}
