/**
 * Regras de recorrência compartilhadas por Tarefas, Compromissos e Financeiro.
 *
 * A recorrência é sempre uma string simples guardada na coluna `recurrence`:
 *   "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
 *   "weekdays:1,3"  → dias específicos da semana (0=dom … 6=sáb)
 *   "everyN:5"      → a cada N dias
 * Valores legados ("once", "") continuam sendo tratados como "não repete".
 */
import { WEEKDAYS } from "./constants";

export type ParsedRecurrence =
  | { kind: "none" }
  | { kind: "daily" }
  | { kind: "weekly" }
  | { kind: "biweekly" }
  | { kind: "monthly" }
  | { kind: "yearly" }
  | { kind: "weekdays"; days: number[] }
  | { kind: "everyN"; days: number };

export function parseRecurrence(value?: string | null): ParsedRecurrence {
  const raw = (value ?? "").trim();
  if (!raw || raw === "once" || raw === "none") return { kind: "none" };
  if (raw.startsWith("weekdays:")) {
    const days = raw
      .slice("weekdays:".length)
      .split(",")
      .map((d) => Number(d.trim()))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    return days.length ? { kind: "weekdays", days: [...new Set(days)].sort() } : { kind: "none" };
  }
  if (raw.startsWith("everyN:")) {
    const days = Number(raw.slice("everyN:".length));
    return Number.isFinite(days) && days > 0 ? { kind: "everyN", days: Math.round(days) } : { kind: "none" };
  }
  if (raw === "daily" || raw === "weekly" || raw === "biweekly" || raw === "monthly" || raw === "yearly") {
    return { kind: raw };
  }
  return { kind: "none" };
}

export function isRecurring(value?: string | null): boolean {
  return parseRecurrence(value).kind !== "none";
}

/** Rótulo legível ("Toda quinta-feira", "A cada 5 dias"…). */
export function recurrenceLabel(value?: string | null): string | null {
  const r = parseRecurrence(value);
  switch (r.kind) {
    case "none":
      return null;
    case "daily":
      return "Todo dia";
    case "weekly":
      return "Toda semana";
    case "biweekly":
      return "A cada 15 dias";
    case "monthly":
      return "Todo mês";
    case "yearly":
      return "Todo ano";
    case "everyN":
      return `A cada ${r.days} dias`;
    case "weekdays": {
      const names = r.days.map((d) => WEEKDAYS[d]?.label ?? "").filter(Boolean);
      if (names.length === 0) return null;
      if (names.length === 1) return `Toda ${names[0].toLowerCase()}`;
      return `Toda ${names.map((n) => n.toLowerCase()).join(", ")}`;
    }
  }
}

const toKey = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

function baseDate(from?: string | null): Date {
  if (from) {
    const d = new Date(`${from.slice(0, 10)}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Próxima data (yyyy-mm-dd) de uma recorrência a partir de `from`.
 * Retorna `null` quando não há recorrência.
 */
export function nextOccurrenceDate(recurrence?: string | null, from?: string | null): string | null {
  const r = parseRecurrence(recurrence);
  if (r.kind === "none") return null;
  const d = baseDate(from);

  switch (r.kind) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "everyN":
      d.setDate(d.getDate() + r.days);
      break;
    case "weekdays": {
      // Procura o próximo dia da semana marcado (1 a 7 dias à frente).
      for (let i = 1; i <= 7; i++) {
        const candidate = new Date(d);
        candidate.setDate(candidate.getDate() + i);
        if (r.days.includes(candidate.getDay())) return toKey(candidate);
      }
      d.setDate(d.getDate() + 7);
      break;
    }
  }
  return toKey(d);
}

/**
 * Próxima data/hora ISO preservando o horário original (compromissos).
 */
export function nextOccurrenceDateTime(recurrence?: string | null, fromIso?: string | null): string | null {
  if (!fromIso) return null;
  const origin = new Date(fromIso);
  if (Number.isNaN(origin.getTime())) return null;
  const nextDay = nextOccurrenceDate(recurrence, toKey(origin));
  if (!nextDay) return null;
  const [y, m, d] = nextDay.split("-").map(Number);
  const next = new Date(origin);
  next.setFullYear(y, m - 1, d);
  return next.toISOString();
}
