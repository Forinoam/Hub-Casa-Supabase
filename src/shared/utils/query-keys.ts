/**
 * Centralized query keys — granular per feature to enable surgical
 * invalidations without over-fetching. Each namespace exposes:
 *   - `all`: root key that invalidates everything under the feature
 *   - `list(homeId)`: the primary list
 *   - specific subsets (byId, today, overdue, completed, pending…)
 */
export const qk = {
  home: {
    all: ["home"] as const,
    /** Full home context: memberships + active home. */
    context: ["home", "context"] as const,
    current: ["home", "current"] as const,
  },
  profile: {
    all: ["profile"] as const,
    me: ["profile", "me"] as const,
  },
  members: {
    all: ["members"] as const,
    list: (homeId?: string) => ["members", homeId] as const,
  },
  invites: {
    all: ["invites"] as const,
    list: (homeId?: string) => ["invites", homeId, "list"] as const,
    mine: ["invites", "mine"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (homeId?: string) => ["tasks", homeId, "list"] as const,
    byId: (id: string) => ["tasks", "byId", id] as const,
    today: (homeId?: string) => ["tasks", homeId, "today"] as const,
    overdue: (homeId?: string) => ["tasks", homeId, "overdue"] as const,
    completed: (homeId?: string) => ["tasks", homeId, "completed"] as const,
    byCategory: (homeId?: string) => ["tasks", homeId, "by-category"] as const,
  },
  shopping: {
    all: ["shopping"] as const,
    list: (homeId?: string) => ["shopping", homeId, "list"] as const,
    byId: (id: string) => ["shopping", "byId", id] as const,
    pending: (homeId?: string) => ["shopping", homeId, "pending"] as const,
    completed: (homeId?: string) => ["shopping", homeId, "completed"] as const,
    urgent: (homeId?: string) => ["shopping", homeId, "urgent"] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    list: (homeId?: string) => ["calendar", homeId, "list"] as const,
    upcoming: (homeId?: string) => ["calendar", homeId, "upcoming"] as const,
    byId: (id: string) => ["calendar", "byId", id] as const,
  },
  finance: {
    all: ["finance"] as const,
    expenses: (homeId?: string) => ["finance", homeId, "expenses"] as const,
    expensesByCategory: (homeId?: string) => ["finance", homeId, "expenses", "by-category"] as const,
    incomes: (homeId?: string) => ["finance", homeId, "incomes"] as const,
    budgets: (homeId?: string) => ["finance", homeId, "budgets"] as const,
    cards: (homeId?: string) => ["finance", homeId, "cards"] as const,
    summary: (homeId?: string) => ["finance", homeId, "summary"] as const,
  },
  maintenance: {

    all: ["maintenance"] as const,
    list: (homeId?: string) => ["maintenance", homeId, "list"] as const,
    next: (homeId?: string) => ["maintenance", homeId, "next"] as const,
    byId: (id: string) => ["maintenance", "byId", id] as const,
  },
  memories: {
    all: ["memories"] as const,
    list: (homeId?: string) => ["memories", homeId, "list"] as const,
    byId: (id: string) => ["memories", "byId", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (homeId?: string) => ["categories", homeId, "list"] as const,
    byModule: (homeId?: string, module?: string) => ["categories", homeId, "by-module", module] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    summary: (homeId?: string) => ["dashboard", homeId, "summary"] as const,
  },
  ai: {
    all: ["ai"] as const,
    conversation: (homeId?: string) => ["ai", homeId, "conversation"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    push: (homeId?: string, userId?: string) => ["notifications", homeId, userId, "push"] as const,
    preferences: (homeId?: string, userId?: string) =>
      ["notifications", homeId, userId, "preferences"] as const,
    history: (homeId?: string) => ["notifications", homeId, "history"] as const,
  },

} as const;
