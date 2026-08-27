import { describe, expect, it } from "vitest";
import { EventModel, filterEvents, splitEvents, toLocalInput } from "../models/event.model";

const base = {
  id: "e1",
  status: "pending" as const,
  visibility: "shared" as const,
  assigned_to: null as string | null,
  start_at: new Date().toISOString(),
  reminder_minutes: 60 as number | null,
};

describe("Disparo de lembretes", () => {
  it("calcula o momento do lembrete", () => {
    const start = "2026-08-20T12:00:00.000Z";
    const at = EventModel.reminderAt({ start_at: start, reminder_minutes: 30 });
    expect(at?.toISOString()).toBe("2026-08-20T11:30:00.000Z");
  });

  it("sem lembrete configurado não dispara", () => {
    expect(EventModel.reminderAt({ start_at: base.start_at, reminder_minutes: null })).toBeNull();
    expect(
      EventModel.isReminderDue({ ...base, reminder_minutes: null }),
    ).toBe(false);
  });

  it("dispara quando o horário do lembrete já passou", () => {
    const start = new Date(Date.now() + 10 * 60_000).toISOString();
    expect(EventModel.isReminderDue({ ...base, start_at: start, reminder_minutes: 60 })).toBe(true);
  });

  it("não dispara antes da hora", () => {
    const start = new Date(Date.now() + 5 * 60 * 60_000).toISOString();
    expect(EventModel.isReminderDue({ ...base, start_at: start, reminder_minutes: 60 })).toBe(false);
  });

  it("compromisso concluído ou cancelado não dispara lembrete", () => {
    const start = new Date(Date.now() - 60_000).toISOString();
    expect(EventModel.isReminderDue({ ...base, start_at: start, status: "done" })).toBe(false);
    expect(EventModel.isReminderDue({ ...base, start_at: start, status: "cancelled" })).toBe(false);
  });
});

describe("Filtros e separação da agenda", () => {
  const events = [
    { ...base, id: "a", visibility: "shared" as const },
    { ...base, id: "b", visibility: "personal" as const, assigned_to: "me" },
    { ...base, id: "c", status: "cancelled" as const },
    { ...base, id: "d", status: "done" as const, assigned_to: "outro" },
  ];

  it("esconde cancelados em qualquer filtro", () => {
    expect(filterEvents(events, "all").map((e) => e.id)).toEqual(["a", "b", "d"]);
  });

  it("filtra meus compromissos", () => {
    expect(filterEvents(events, "mine", "me").map((e) => e.id)).toEqual(["b"]);
  });

  it("filtra por morador responsável", () => {
    expect(filterEvents(events, "outro").map((e) => e.id)).toEqual(["d"]);
  });

  it("separa pendentes de realizados", () => {
    const { pending, done } = splitEvents(events);
    expect(pending).toHaveLength(3);
    expect(done).toHaveLength(1);
  });

  it("converte ISO para input datetime-local", () => {
    expect(toLocalInput("2026-08-20T12:00:00.000Z")).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
