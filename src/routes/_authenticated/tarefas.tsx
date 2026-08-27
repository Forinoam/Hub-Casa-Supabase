import { createFileRoute } from "@tanstack/react-router";
import { CategoryChip } from "@/shared/components/CategoryChip";
import { pageHead } from "@/shared/utils/head";
import { useMemo, useState } from "react";
import { AppShell } from "@/shared/components/AppShell";
import { CardBlock } from "@/components/ui/card-block";
import { EmptyState } from "@/shared/components/EmptyState";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { RoundIconButton } from "@/shared/components/RoundIconButton";
import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import {
  RecurrenceField,
  PriorityField,
  PriorityBadge,
  recurrenceToState,
  stateToRecurrence,
  type RecurrenceState,
} from "@/shared/components/RecurrenceField";
import { useTasks, useTaskMutations, TaskModel, URGENCY_STYLES } from "@/modules/tasks";
import { TASK_CATEGORIES, PRIORITY_WEIGHT } from "@/shared/utils/constants";
import { useModuleCategories } from "@/modules/categories";
import { recurrenceLabel, isRecurring, nextOccurrenceDate } from "@/shared/utils/recurrence";
import { formatDate } from "@/shared/utils/format";
import { entityVisual } from "@/shared/utils/entity-visuals";
import type { Task } from "@/shared/types";
import { toast } from "sonner";
import { X, Pencil, Repeat, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => pageHead({
    title: "Tarefas da casa — Casa Hub",
    description: "Organize e divida as tarefas domésticas com prazos, prioridades, recorrência e responsáveis.",
    path: "/tarefas",
    noindex: true,
  }),
  component: TasksPage,
});

type Draft = {
  title: string;
  category: string;
  due_date: string;
  priority: string;
  recurrence: RecurrenceState;
};

const emptyDraft = (category: string): Draft => ({
  title: "",
  category,
  due_date: "",
  priority: "none",
  recurrence: recurrenceToState(null),
});

function TasksPage() {
  const { data: tasks = [] } = useTasks();
  const { create, update, toggle, createNext, remove } = useTaskMutations();
  const categories = useModuleCategories("tasks", TASK_CATEGORIES);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(TASK_CATEGORIES[0]));
  /** Tarefa recorrente recém-concluída aguardando confirmação do usuário. */
  const [pendingNext, setPendingNext] = useState<Task | null>(null);

  const visual = entityVisual("task");

  /**
   * Pendentes primeiro, ordenadas por urgência da data e depois pela
   * prioridade manual — os dois conceitos coexistem sem se anular.
   */
  const ordered = useMemo(() => {
    const rank = (t: Task) => {
      const days = TaskModel.daysUntilDue(t);
      return days === null ? 9_999 : days;
    };
    return [...tasks].sort((a, b) => {
      if (!!a.completed !== !!b.completed) return a.completed ? 1 : -1;
      const byDate = rank(a) - rank(b);
      if (byDate !== 0) return byDate;
      return (PRIORITY_WEIGHT[b.priority ?? "none"] ?? 0) - (PRIORITY_WEIGHT[a.priority ?? "none"] ?? 0);
    });
  }, [tasks]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft(categories[0] ?? TASK_CATEGORIES[0]));
    setOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setDraft({
      title: t.title,
      category: t.category ?? categories[0] ?? "Outros",
      due_date: t.due_date ?? "",
      priority: t.priority ?? "none",
      recurrence: recurrenceToState(t.recurrence),
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const payload = {
      title,
      category: draft.category || categories[0] || "Outros",
      due_date: draft.due_date || null,
      recurrence: stateToRecurrence(draft.recurrence),
      priority: draft.priority,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, patch: payload });
      toast.success("Tarefa atualizada");
    } else {
      await create.mutateAsync(payload);
      toast.success("Tarefa criada");
    }
    setOpen(false);
    setEditing(null);
  };

  const handleToggle = async (task: Task) => {
    await toggle.mutateAsync(task);
    // Recorrente concluída → o usuário decide se quer a próxima ocorrência.
    if (!task.completed && isRecurring(task.recurrence)) setPendingNext(task);
  };

  const confirmNext = async () => {
    if (!pendingNext) return;
    await createNext.mutateAsync(pendingNext);
    toast.success("Próxima ocorrência criada");
    setPendingNext(null);
  };

  const nextDatePreview = pendingNext
    ? nextOccurrenceDate(pendingNext.recurrence, pendingNext.due_date)
    : null;

  return (
    <AppShell
      subtitle="Central de tarefas"
      title="Tarefas"
      action={<RoundIconButton icon="plus" label="Nova tarefa" onClick={openCreate} />}
    >
      {ordered.length === 0 ? (
        <EmptyState
          message="Nenhuma tarefa ainda."
          action={
            <button onClick={openCreate} className="rounded-full bg-sage-800 px-5 py-2 text-sm text-sage-50">
              Criar primeira tarefa
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {ordered.map((t) => {
            const urgency = TaskModel.urgency(t);
            const style = URGENCY_STYLES[urgency];
            const rec = recurrenceLabel(t.recurrence);
            return (
              <li key={t.id} id={`item-${t.id}`}>
                <CardBlock className="overflow-hidden p-0">
                  <div className="flex">
                    {/* Faixa de urgência: só a data influencia esta cor. */}
                    <span aria-hidden className={`w-1 shrink-0 ${style.bar}`} />
                    <div className="flex flex-1 items-start gap-3 p-4">
                      <button
                        onClick={() => handleToggle(t)}
                        aria-label={t.completed ? "Desmarcar tarefa" : "Concluir tarefa"}
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                          t.completed ? "border-sage-800 bg-sage-800" : "border-sage-200"
                        }`}
                      >
                        {t.completed && <span className="size-2.5 rounded-sm bg-clay-600" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${t.completed ? "text-sage-800/40 line-through" : ""}`}>
                            {t.title}
                          </p>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => openEdit(t)}
                              aria-label="Editar tarefa"
                              className="text-sage-800/30 hover:text-sage-800"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => remove.mutate(t.id)}
                              aria-label="Excluir tarefa"
                              className="text-sage-800/30 hover:text-destructive"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-sage-800/60">
                          <CategoryChip name={t.category} module="tasks" />
                          <PriorityBadge value={t.priority} />
                          {t.due_date && (
                            <span className={`inline-flex items-center gap-1 ${style.text}`}>
                              <Bell className="size-3" aria-label="Gera lembrete" />
                              {style.label ? `${style.label} · ` : ""}
                              {formatDate(t.due_date)}
                            </span>
                          )}

                          {rec && (
                            <span className="inline-flex items-center gap-1 text-sage-800/45">
                              <Repeat className="size-3" />
                              {rec}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBlock>
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar tarefa" : "Nova tarefa"}
      >
        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            placeholder="Ex: Lavar louça"
            className={fieldClass()}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <select
            className={fieldClass()}
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            className={fieldClass()}
            value={draft.due_date}
            onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
          />
          <PriorityField value={draft.priority} onChange={(priority) => setDraft({ ...draft, priority })} />
          <RecurrenceField
            value={draft.recurrence}
            onChange={(recurrence) => setDraft({ ...draft, recurrence })}
          />
          <button
            type="submit"
            disabled={!draft.title.trim() || create.isPending || update.isPending}
            className={primaryButtonClass()}
          >
            {editing ? "Salvar alterações" : create.isPending ? "Criando..." : "Criar tarefa"}
          </button>
        </form>
      </BottomSheet>

      {/* Recorrência nunca recria sozinha: sempre pergunta. */}
      <BottomSheet open={!!pendingNext} onClose={() => setPendingNext(null)} title="Repetir tarefa?">
        <div className="space-y-4">
          <p className="text-sm text-sage-800/70">
            <span className="font-medium text-sage-800">{pendingNext?.title}</span> é uma tarefa recorrente
            {recurrenceLabel(pendingNext?.recurrence) ? ` (${recurrenceLabel(pendingNext?.recurrence)?.toLowerCase()})` : ""}.
            {nextDatePreview ? ` Quer criar a próxima para ${formatDate(nextDatePreview)}?` : " Quer criar a próxima ocorrência?"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPendingNext(null)}
              className="flex-1 rounded-full bg-sage-100 py-3 text-sm text-sage-800"
            >
              Agora não
            </button>
            <button
              onClick={confirmNext}
              disabled={createNext.isPending}
              className={primaryButtonClass("flex-1")}
            >
              {createNext.isPending ? "Criando..." : "Criar próxima"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
