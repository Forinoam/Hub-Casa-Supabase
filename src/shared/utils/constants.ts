/**
 * Centralized enums, category defaults, and palettes.
 */
export const MODULES = [
  { id: "tasks", label: "Tarefas" },
  { id: "shopping", label: "Compras" },
  { id: "expenses", label: "Despesas" },
  { id: "maintenance", label: "Manutenção" },
] as const;
export type ModuleId = (typeof MODULES)[number]["id"];

/**
 * Fallbacks usados apenas quando a casa ainda não tem categorias próprias
 * cadastradas (o banco semeia as padrões, mas a UI nunca pode ficar vazia).
 */
export const TASK_CATEGORIES = [
  "Cozinha", "Banheiro", "Lavanderia", "Sala", "Quarto",
  "Pets", "Jardim", "Organização", "Manutenção", "Outros",
];

export const SHOPPING_CATEGORIES = ["Mercado", "Farmácia", "Casa", "Pets", "Outros"];

export const EXPENSE_CATEGORIES = [
  "Energia", "Água", "Internet", "Mercado", "Moradia",
  "Pets", "Transporte", "Streaming", "Seguro", "Outros",
];

export const MAINTENANCE_CATEGORIES = [
  "Elétrica", "Hidráulica", "Eletrodomésticos", "Ar-condicionado", "Veículos", "Outros",
];

/**
 * Recorrência (tarefas e compromissos). O valor é uma string simples salva
 * na coluna `recurrence`:
 *   ""                 → não repete
 *   "daily"            → todo dia
 *   "weekly"           → a cada 7 dias
 *   "biweekly"         → a cada 14 dias
 *   "monthly"          → todo mês
 *   "yearly"           → todo ano
 *   "weekdays:1,3"     → dias específicos da semana (0=dom … 6=sáb)
 *   "everyN:5"         → a cada N dias
 */
export const TASK_RECURRENCES = [
  { id: "", label: "Não repete" },
  { id: "daily", label: "Diariamente" },
  { id: "weekdays", label: "Dias específicos da semana" },
  { id: "weekly", label: "Semanalmente" },
  { id: "biweekly", label: "A cada 15 dias" },
  { id: "monthly", label: "Mensalmente" },
  { id: "yearly", label: "Anualmente" },
  { id: "everyN", label: "Intervalo personalizado (dias)" },
] as const;

export const WEEKDAYS = [
  { id: 0, short: "Dom", label: "Domingo" },
  { id: 1, short: "Seg", label: "Segunda" },
  { id: 2, short: "Ter", label: "Terça" },
  { id: 3, short: "Qua", label: "Quarta" },
  { id: 4, short: "Qui", label: "Quinta" },
  { id: 5, short: "Sex", label: "Sexta" },
  { id: 6, short: "Sáb", label: "Sábado" },
] as const;

/** Prioridade manual — mesmos valores em tarefas, compras e compromissos. */
export const PRIORITIES = [
  { id: "none", label: "Sem prioridade", short: "—" },
  { id: "low", label: "Baixa", short: "Baixa" },
  { id: "medium", label: "Média", short: "Média" },
  { id: "high", label: "Alta", short: "Alta" },
] as const;
export type PriorityId = (typeof PRIORITIES)[number]["id"];

/** Peso usado apenas para ordenação (maior = mais importante). */
export const PRIORITY_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

/** Antecedência de lembrete dos compromissos (minutos). */
export const EVENT_REMINDERS = [
  { value: "", label: "Sem lembrete" },
  { value: "0", label: "Na hora" },
  { value: "5", label: "5 minutos antes" },
  { value: "15", label: "15 minutos antes" },
  { value: "30", label: "30 minutos antes" },
  { value: "60", label: "1 hora antes" },
  { value: "120", label: "2 horas antes" },
  { value: "1440", label: "1 dia antes" },
  { value: "2880", label: "2 dias antes" },
  { value: "10080", label: "1 semana antes" },
] as const;



export const EVENT_CATEGORIES = [
  { id: "compromisso", label: "Compromisso" },
  { id: "visita", label: "Visita" },
  { id: "viagem", label: "Viagem" },
  { id: "aniversario", label: "Aniversário" },
  { id: "entrega", label: "Entrega" },
  { id: "consulta", label: "Consulta" },
] as const;

export const EXPENSE_RECURRENCES = [
  { id: "", label: "Única" },
  { id: "monthly", label: "Mensal" },
  { id: "weekly", label: "Semanal" },
  { id: "yearly", label: "Anual" },
] as const;

export const PAYMENT_METHODS = [
  { id: "", label: "Não informado" },
  { id: "cash", label: "Dinheiro" },
  { id: "pix", label: "Pix" },
  { id: "debit", label: "Débito" },
  { id: "credit", label: "Crédito" },
  { id: "boleto", label: "Boleto" },
  { id: "other", label: "Outro" },
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  boleto: "Boleto",
  other: "Outro",
};

export const INCOME_RECURRENCES = [
  { id: "monthly", label: "Mensal" },
  { id: "weekly", label: "Semanal" },
  { id: "yearly", label: "Anual" },
  { id: "once", label: "Única" },
] as const;

export const CATEGORY_COLORS = [
  "#8B9D83", "#C97B5C", "#D4A574", "#7A9E7E",
  "#B57560", "#5F7A8B", "#A87B94",
] as const;

export const OWNER_COLORS = [
  "bg-clay-600",
  "bg-sage-800",
  "bg-[#5F7A8B]",
  "bg-[#A87B94]",
  "bg-[#7A9E7E]",
] as const;

/** Query staleTime presets (ms). */
export const STALE = {
  short: 30_000,
  medium: 60_000,
  long: 5 * 60_000,
} as const;

/** Tipos de lançamento financeiro. */
export const EXPENSE_KINDS = [
  { id: "bill", label: "Conta / despesa", hint: "Tem vencimento e status de pagamento" },
  { id: "spend", label: "Gasto", hint: "Já aconteceu, só registrar" },
] as const;
export type ExpenseKind = (typeof EXPENSE_KINDS)[number]["id"];
