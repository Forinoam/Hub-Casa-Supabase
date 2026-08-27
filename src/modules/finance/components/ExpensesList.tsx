import { CardBlock } from "@/components/ui/card-block";
import { CategoryChip } from "@/shared/components/CategoryChip";
import { EmptyState } from "@/shared/components/EmptyState";
import { entityVisual } from "@/shared/utils/entity-visuals";
import { formatCurrency, formatDate } from "@/shared/utils/format";
import { X, Pencil, Bell } from "lucide-react";
import type { Expense } from "@/shared/types";
import { ExpenseModel } from "../models/expense.model";

export function ExpensesList({
  expenses,
  emptyMessage,
  onTogglePaid,
  onEdit,
  onRemove,
}: {
  expenses: Expense[];
  emptyMessage: string;
  onTogglePaid?: (e: Expense) => void;
  onEdit: (e: Expense) => void;
  onRemove: (id: string) => void;
}) {
  if (expenses.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <ul className="space-y-3">
      {expenses.map((e) => {
        const visual = entityVisual(ExpenseModel.isBill(e) ? "bill" : "spend");
        const Icon = visual.icon;
        const overdue = ExpenseModel.isOverdue(e);
        return (
          <li key={e.id} id={`item-${e.id}`}>
            <CardBlock className={`flex items-center gap-3 p-4 ${overdue ? "ring-clay-600/25" : ""}`}>
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${visual.chip}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${e.paid ? "line-through opacity-50" : ""}`}>
                  {e.description}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-sage-800/60">
                  <CategoryChip name={e.category} module="expenses" />
                  {e.due_date && (
                    <span className="inline-flex items-center gap-1">
                      {ExpenseModel.isBill(e) && !e.paid && <Bell className="size-3" aria-label="Gera lembrete" />}
                      {`${ExpenseModel.isBill(e) ? "vence" : "em"} ${formatDate(e.due_date)}`}
                      {overdue && " • atrasada"}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {e.amount === null ? (
                    <span className="text-sage-800/40">a definir</span>
                  ) : (
                    formatCurrency(e.amount)
                  )}
                </p>
                {onTogglePaid && (
                  <button
                    type="button"
                    onClick={() => onTogglePaid(e)}
                    className="text-[10px] font-medium uppercase tracking-wider text-clay-600"
                  >
                    {e.paid ? "reabrir" : "marcar paga"}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onEdit(e)}
                aria-label="Editar lançamento"
                className="text-sage-800/30 hover:text-sage-800"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(e.id)}
                aria-label="Remover lançamento"
                className="text-sage-800/30 hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </CardBlock>
          </li>
        );
      })}
    </ul>
  );
}
