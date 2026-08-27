import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHome } from "@/shared/hooks/useHome";
import { getAuthUserId } from "@/shared/hooks/useAuthUser";
import { qk } from "@/shared/utils/query-keys";
import { assertHomeContext, reportError } from "@/shared/utils/errors";
import { STALE } from "@/shared/utils/constants";
import { emit } from "@/automation/bus";
import {
  applyOptimistic,
  patchItem,
  removeItem,
  rollbackOptimistic,
  type OptimisticSnapshot,
} from "@/shared/utils/optimistic";
import type { Task } from "@/shared/types";
import * as service from "../services/tasks.service";

const SCOPE = "Tarefas";

export function useTasks() {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.tasks.list(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listTasks(homeId!),
  });
}

export function useTodayTasks(limit = 6) {
  const { data: home } = useHome();
  const homeId = home?.home_id;
  return useQuery({
    queryKey: qk.tasks.today(homeId),
    enabled: !!homeId,
    staleTime: STALE.short,
    queryFn: () => service.listTodayTasks(homeId!, limit),
  });
}

export function useTaskMutations() {
  const qc = useQueryClient();
  const { data: home } = useHome();
  const homeId = home?.home_id;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.tasks.all });
    qc.invalidateQueries({ queryKey: qk.dashboard.all });
  };

  /** Listas em cache que refletem tarefas na UI. */
  const taskKeys = () => [qk.tasks.list(homeId), qk.tasks.today(homeId)];

  const create = useMutation({
    mutationFn: async (input: service.CreateTaskInput) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createTask(homeId, userId, input);
    },
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e, "Erro ao criar tarefa."),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: service.UpdateTaskInput }) =>
      service.updateTask(id, patch),
    onMutate: ({ id, patch }) =>
      applyOptimistic<Task[]>(qc, taskKeys(), patchItem<Task>(id, patch as Partial<Task>)),
    onError: (e, _vars, ctx) => {
      rollbackOptimistic(qc, ctx as OptimisticSnapshot);
      reportError(SCOPE, e, "Erro ao atualizar tarefa.");
    },
    onSettled: () => invalidate(),
  });

  /**
   * Conclui/reabre a tarefa. A próxima ocorrência de uma tarefa recorrente
   * NÃO é criada aqui — quem decide é o usuário (ver `createNext`).
   */
  const toggle = useMutation({
    mutationFn: async (task: Pick<Task, "id" | "completed" | "title" | "recurrence" | "category" | "due_date">) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      const nextCompleted = !task.completed;
      await service.setTaskCompleted(task.id, userId, nextCompleted);
      return { task, userId, nextCompleted };
    },
    onMutate: (task) =>
      applyOptimistic<Task[]>(
        qc,
        taskKeys(),
        patchItem<Task>(task.id, {
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null,
        } as Partial<Task>),
      ),
    onSuccess: ({ task, userId, nextCompleted }) => {
      if (nextCompleted) {
        emit({
          type: "task.completed",
          homeId: homeId!,
          taskId: task.id,
          title: task.title,
          completedBy: userId,
          recurrence: task.recurrence,
          category: task.category,
          dueDate: task.due_date,
        });
      }
    },
    onError: (e, _vars, ctx) => {
      rollbackOptimistic(qc, ctx as OptimisticSnapshot);
      reportError(SCOPE, e, "Erro ao atualizar tarefa.");
    },
    onSettled: () => invalidate(),
  });

  /** Cria a próxima ocorrência de uma tarefa recorrente (ação explícita). */
  const createNext = useMutation({
    mutationFn: async (task: Pick<Task, "title" | "category" | "recurrence" | "due_date" | "priority">) => {
      const userId = await getAuthUserId();
      assertHomeContext(SCOPE, userId, homeId);
      return service.createNextOccurrence(homeId!, userId, task);
    },
    onSuccess: () => invalidate(),
    onError: (e) => reportError(SCOPE, e, "Erro ao criar a próxima ocorrência."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.deleteTask(id),
    onMutate: (id) => applyOptimistic<Task[]>(qc, taskKeys(), removeItem<Task>(id)),
    onError: (e, _vars, ctx) => {
      rollbackOptimistic(qc, ctx as OptimisticSnapshot);
      reportError(SCOPE, e, "Erro ao excluir tarefa.");
    },
    onSettled: () => invalidate(),
  });

  return { create, update, toggle, createNext, remove };
}
