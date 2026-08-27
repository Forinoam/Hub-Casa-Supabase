import { WEEKDAYS, TASK_RECURRENCES, PRIORITIES } from "@/shared/utils/constants";
import { fieldClass } from "./form-fields";
import { parseRecurrence } from "@/shared/utils/recurrence";

/**
 * Campos de formulário compartilhados por Tarefas, Compromissos e Financeiro.
 * Trabalham com um valor de recorrência em string (ver `utils/recurrence.ts`)
 * para que nenhuma tela precise conhecer o formato interno.
 */

/** Converte a string salva no banco no estado do seletor. */
export function recurrenceToState(value?: string | null) {
  const r = parseRecurrence(value);
  if (r.kind === "weekdays") return { mode: "weekdays", days: r.days, interval: 7 };
  if (r.kind === "everyN") return { mode: "everyN", days: [] as number[], interval: r.days };
  if (r.kind === "none") return { mode: "", days: [] as number[], interval: 7 };
  return { mode: r.kind, days: [] as number[], interval: 7 };
}

/** Converte o estado do seletor na string salva no banco. */
export function stateToRecurrence(state: { mode: string; days: number[]; interval: number }): string | null {
  if (!state.mode) return null;
  if (state.mode === "weekdays") {
    return state.days.length ? `weekdays:${[...state.days].sort().join(",")}` : null;
  }
  if (state.mode === "everyN") {
    const n = Math.max(1, Math.round(state.interval || 1));
    return `everyN:${n}`;
  }
  return state.mode;
}

export type RecurrenceState = ReturnType<typeof recurrenceToState>;

export function RecurrenceField({
  value,
  onChange,
  label = "Repetição",
}: {
  value: RecurrenceState;
  onChange: (next: RecurrenceState) => void;
  label?: string;
}) {
  const toggleDay = (day: number) => {
    const days = value.days.includes(day) ? value.days.filter((d) => d !== day) : [...value.days, day];
    onChange({ ...value, days });
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">{label}</label>
      <select
        className={fieldClass()}
        value={value.mode}
        onChange={(e) => onChange({ ...value, mode: e.target.value })}
      >
        {TASK_RECURRENCES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      {value.mode === "weekdays" && (
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d) => {
            const active = value.days.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  active ? "bg-sage-800 text-sage-50" : "bg-sage-100 text-sage-800/70"
                }`}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      )}

      {value.mode === "everyN" && (
        <div className="flex items-center gap-2 text-sm text-sage-800/70">
          <span>A cada</span>
          <input
            type="number"
            min={1}
            value={value.interval}
            onChange={(e) => onChange({ ...value, interval: Number(e.target.value) })}
            className={fieldClass("w-20 py-2 text-center")}
          />
          <span>dias</span>
        </div>
      )}
    </div>
  );
}

export function PriorityField({
  value,
  onChange,
  label = "Prioridade",
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wide text-sage-800/50">{label}</label>
      <div className="flex gap-1.5">
        {PRIORITIES.map((p) => {
          const active = (value || "none") === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              aria-pressed={active}
              className={`flex-1 rounded-full px-2 py-2 text-xs transition ${
                active ? "bg-sage-800 text-sage-50" : "bg-sage-100 text-sage-800/70"
              }`}
            >
              {p.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Selo compacto de prioridade para listas (não renderiza nada em "none"). */
export function PriorityBadge({ value }: { value?: string | null }) {
  const id = value || "none";
  if (id === "none") return null;
  const styles: Record<string, string> = {
    high: "bg-clay-600/15 text-clay-600",
    medium: "bg-[#D4A574]/25 text-[#8A6437]",
    low: "bg-sage-100 text-sage-800/60",
  };
  const label = PRIORITIES.find((p) => p.id === id)?.short ?? id;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] ${styles[id] ?? styles.low}`}>{label}</span>;
}
