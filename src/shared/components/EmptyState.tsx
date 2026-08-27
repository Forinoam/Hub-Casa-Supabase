import type { ReactNode } from "react";
import { CardBlock } from "@/components/ui/card-block";

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

/**
 * Standard empty-list card used across every module.
 * Consolidates the ad-hoc "text-center text-sm text-sage-800/60" pattern
 * that was copy-pasted in tarefas/compras/estoque/etc.
 */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <CardBlock className="text-center">
      <p className="text-sm text-sage-800/60">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </CardBlock>
  );
}
