/**
 * Domain event catalog. Each event describes something that already happened
 * in a service; handlers under `../handlers/` react to update other modules.
 *
 * Keep payloads flat and JSON-serializable — they may be logged, replayed or
 * (eventually) shipped to a server-side automation worker.
 */
export type DomainEvent =
  // ── Household / shared houses ──────────────────────────────────────────
  | { type: "home.created"; homeId: string; name: string; createdBy: string }
  | { type: "home.updated"; homeId: string; name: string }
  | { type: "home.settingsUpdated"; homeId: string }
  | { type: "home.switched"; homeId: string; name: string }
  | { type: "member.joined"; homeId: string; userId: string; role: string }
  | { type: "member.left"; homeId: string; userId: string }
  | { type: "member.roleChanged"; homeId: string; userId: string; role: string }
  | { type: "invite.created"; homeId: string; inviteId: string; email: string }
  | { type: "invite.revoked"; homeId: string; inviteId: string }
  | { type: "invite.accepted"; homeId: string; userId: string }
  | {
      type: "task.completed";
      homeId: string;
      taskId: string;
      title: string;
      completedBy: string;
      /** Recorrência da tarefa; a próxima ocorrência é criada só com confirmação do usuário. */
      recurrence?: string | null;
      category?: string | null;
      dueDate?: string | null;
    }
  | {
      type: "shopping.completed";
      homeId: string;
      itemId: string;
      name: string;
      quantity: number;
      unit: string | null;
      /** Optional purchase amount if the UI ever captures it (not persisted today). */
      amount?: number | null;
    }
  | {
      type: "expense.created";
      homeId: string;
      expenseId: string;
      description: string;
      /** null = conta variável sem valor definido ainda. */
      amount: number | null;
      category: string;
    }
  | {
      type: "expense.paid";
      homeId: string;
      expenseId: string;
      description: string;
      /** null = conta variável sem valor definido ainda. */
      amount: number | null;
      category: string;
      /** Recorrência da conta — dispara a próxima conta automaticamente. */
      recurrence?: string | null;
      dueDate?: string | null;
    }
  | {
      type: "maintenance.completed";
      homeId: string;
      itemId: string;
      name: string;
      intervalDays: number | null;
      /** ISO date (yyyy-mm-dd) of the next occurrence created, if any. */
      nextDue: string | null;
    }
  | {
      type: "event.created";
      homeId: string;
      eventId: string;
      title: string;
      category: string | null;
      startAt: string;
    };

export type DomainEventType = DomainEvent["type"];
export type EventOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;
