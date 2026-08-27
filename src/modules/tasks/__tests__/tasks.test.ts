import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { TaskModel } from "../models/task.model";
import { todayKey } from "@/shared/utils/format";
import {
  applyOptimistic,
  patchItem,
  removeItem,
  rollbackOptimistic,
} from "@/shared/utils/optimistic";

const day = (offset: number) => {
  const d = new Date(`${todayKey()}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const task = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  title: "Lavar louça",
  category: "Cozinha",
  due_date: todayKey(),
  completed: false,
  ...over,
});

describe("TaskModel — urgência e conclusão", () => {
  it("marca tarefa vencida como atrasada", () => {
    const t = task({ due_date: day(-2) });
    expect(TaskModel.isOverdue(t as never)).toBe(true);
    expect(TaskModel.urgency(t as never)).toBe("overdue");
  });

  it("classifica a tarefa de hoje", () => {
    expect(TaskModel.urgency(task() as never)).toBe("today");
    expect(TaskModel.isToday(task() as never)).toBe(true);
  });

  it("classifica prazos futuros por faixa", () => {
    expect(TaskModel.urgency(task({ due_date: day(2) }) as never)).toBe("soon");
    expect(TaskModel.urgency(task({ due_date: day(7) }) as never)).toBe("near");
    expect(TaskModel.urgency(task({ due_date: day(30) }) as never)).toBe("far");
  });

  it("tarefa concluída perde urgência", () => {
    const t = task({ due_date: day(-5), completed: true });
    expect(TaskModel.isOverdue(t as never)).toBe(false);
    expect(TaskModel.urgency(t as never)).toBe("none");
  });
});

describe("Fluxo criar / editar / concluir tarefa", () => {
  const service = {
    createTask: vi.fn(async (homeId: string, userId: string, input: Record<string, unknown>) => ({
      id: "new", home_id: homeId, created_by: userId, completed: false, ...input,
    })),
    updateTask: vi.fn(async (id: string, patch: Record<string, unknown>) => ({ id, ...patch })),
    setTaskCompleted: vi.fn(async (_id: string, _userId: string, _next: boolean) => undefined),
  };

  beforeEach(() => vi.clearAllMocks());

  it("cria a tarefa com casa e usuário do contexto", async () => {
    const created = await service.createTask("home-1", "user-1", {
      title: "Regar plantas",
      category: "Casa",
      due_date: todayKey(),
    });
    expect(service.createTask).toHaveBeenCalledOnce();
    expect(created).toMatchObject({ home_id: "home-1", created_by: "user-1", title: "Regar plantas" });
  });

  it("edita apenas os campos enviados", async () => {
    const updated = await service.updateTask("t1", { title: "Novo título" });
    expect(updated).toEqual({ id: "t1", title: "Novo título" });
  });

  it("conclui e reabre a tarefa", async () => {
    await service.setTaskCompleted("t1", "user-1", true);
    await service.setTaskCompleted("t1", "user-1", false);
    expect(service.setTaskCompleted).toHaveBeenNthCalledWith(1, "t1", "user-1", true);
    expect(service.setTaskCompleted).toHaveBeenNthCalledWith(2, "t1", "user-1", false);
  });
});

describe("Updates otimistas e rollback", () => {
  const key = ["tasks", "list", "home-1"];

  const seed = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(key, [task(), task({ id: "t2", title: "Varrer" })]);
    return qc;
  };

  it("aplica a conclusão na UI antes da resposta do servidor", async () => {
    const qc = seed();
    await applyOptimistic(qc, [key], patchItem<{ id: string; completed: boolean }>("t1", { completed: true }));
    const list = qc.getQueryData<Array<{ id: string; completed: boolean }>>(key)!;
    expect(list.find((t) => t.id === "t1")!.completed).toBe(true);
  });

  it("restaura o estado anterior quando a mutation falha", async () => {
    const qc = seed();
    const before = qc.getQueryData(key);
    const ctx = await applyOptimistic(qc, [key], patchItem<{ id: string; completed: boolean }>("t1", { completed: true }));
    rollbackOptimistic(qc, ctx);
    expect(qc.getQueryData(key)).toEqual(before);
  });

  it("remove otimista e desfaz no rollback", async () => {
    const qc = seed();
    const ctx = await applyOptimistic(qc, [key], removeItem<{ id: string }>("t2"));
    expect(qc.getQueryData<unknown[]>(key)).toHaveLength(1);
    rollbackOptimistic(qc, ctx);
    expect(qc.getQueryData<unknown[]>(key)).toHaveLength(2);
  });
});
