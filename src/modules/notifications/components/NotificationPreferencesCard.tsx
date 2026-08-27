import { BellRing } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";
import { fieldClass } from "@/shared/components/form-fields";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import type { NotificationPreferences } from "../services/notification-preferences.service";

const TOGGLES: { key: keyof NotificationPreferences; label: string; hint: string }[] = [
  { key: "enabled_events", label: "Compromissos da agenda", hint: "Lembretes no horário definido no compromisso." },
  { key: "enabled_tasks", label: "Tarefas do dia", hint: "Aviso das tarefas com data para hoje." },
  { key: "enabled_bills", label: "Contas a vencer", hint: "Aviso antes do vencimento das contas." },
  { key: "enabled_maintenance", label: "Manutenções previstas", hint: "Aviso antes da manutenção programada." },
  { key: "enabled_shopping", label: "Lista de compras", hint: "Resumo semanal dos itens pendentes." },
  { key: "enabled_budget", label: "Alertas de orçamento", hint: "Aviso quando uma categoria passa de 90% do limite." },
];

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function timeInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

export function NotificationPreferencesCard() {
  const { preferences, isLoading, update } = useNotificationPreferences();

  if (isLoading || !preferences) {
    return (
      <CardBlock>
        <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">Avisos automáticos</p>
        <p className="text-sm text-sage-800/60">Carregando preferências...</p>
      </CardBlock>
    );
  }

  const p = preferences;

  return (
    <CardBlock>
      <p className="mb-3 text-xs uppercase tracking-widest text-sage-800/40">Avisos automáticos</p>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-9 place-items-center rounded-full bg-sage-100 text-sage-800">
          <BellRing className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-sage-800">O que você quer receber</p>
          <p className="text-sm text-sage-800/70">Escolha os tipos de lembrete e quando eles devem chegar.</p>

          <ul className="mt-4 space-y-3">
            {TOGGLES.map((t) => {
              const checked = Boolean(p[t.key]);
              return (
                <li key={t.key} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-sage-800/60">{t.hint}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={checked}
                    aria-label={t.label}
                    onClick={() => update.mutate({ [t.key]: !checked } as never)}
                    className={`mt-1 h-6 w-11 shrink-0 rounded-full transition ${
                      checked ? "bg-sage-800" : "bg-sage-200"
                    }`}
                  >
                    <span
                      className={`block size-5 rounded-full bg-white transition ${
                        checked ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-sage-800/60">Horário do resumo diário</span>
              <input
                type="time"
                className={fieldClass()}
                value={timeInputValue(p.daily_digest_time)}
                onChange={(e) => update.mutate({ daily_digest_time: `${e.target.value}:00` })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-sage-800/60">Dia do resumo de compras</span>
              <select
                className={fieldClass()}
                value={p.shopping_weekday}
                onChange={(e) => update.mutate({ shopping_weekday: Number(e.target.value) })}
              >
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-sage-800/60">Antecedência das contas</span>
              <select
                className={fieldClass()}
                value={p.bill_lead_days}
                onChange={(e) => update.mutate({ bill_lead_days: Number(e.target.value) })}
              >
                {[0, 1, 2, 3, 5, 7].map((d) => (
                  <option key={d} value={d}>{d === 0 ? "No dia" : `${d} dia${d > 1 ? "s" : ""} antes`}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-sage-800/60">Antecedência das manutenções</span>
              <select
                className={fieldClass()}
                value={p.maintenance_lead_days}
                onChange={(e) => update.mutate({ maintenance_lead_days: Number(e.target.value) })}
              >
                {[0, 1, 2, 3, 5, 7].map((d) => (
                  <option key={d} value={d}>{d === 0 ? "No dia" : `${d} dia${d > 1 ? "s" : ""} antes`}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-sage-800/60">Silêncio a partir de</span>
              <input
                type="time"
                className={fieldClass()}
                value={timeInputValue(p.quiet_hours_start)}
                onChange={(e) =>
                  update.mutate({ quiet_hours_start: e.target.value ? `${e.target.value}:00` : null })
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-sage-800/60">Silêncio até</span>
              <input
                type="time"
                className={fieldClass()}
                value={timeInputValue(p.quiet_hours_end)}
                onChange={(e) =>
                  update.mutate({ quiet_hours_end: e.target.value ? `${e.target.value}:00` : null })
                }
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-sage-800/50">
            Durante a janela de silêncio nenhum aviso é enviado; ele volta assim que a janela termina.
          </p>
        </div>
      </div>
    </CardBlock>
  );
}
