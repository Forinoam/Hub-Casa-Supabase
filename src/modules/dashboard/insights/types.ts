/**
 * Casa Hub — Motor de Insights.
 *
 * Cada arquivo neste diretório expõe UMA função `build*Insight(input)` que
 * devolve `Insight | Insight[] | null`. O agregador `buildInsights` chama
 * todos os geradores e ordena por severidade. Hoje o dashboard consome
 * `buildInsights`; amanhã a IA da Casa poderá consumir a mesma lista para
 * gerar recomendações personalizadas — sem duplicar lógica.
 */
export type InsightKind =
  | "overdueTasks"
  | "maintenanceDue"
  | "shoppingSuggestion"
  | "financialAlert"
  | "budgetAlert";

export type InsightSeverity = 1 | 2 | 3; // 3 = urgente

export type Insight = {
  id: string;
  kind: InsightKind;
  title: string;
  description: string;
  severity: InsightSeverity;
  route?: "/tarefas" | "/compras" | "/estoque" | "/manutencao" | "/financeiro" | "/calendario";
};
