/**
 * Casa Hub — Histórico da Casa (stub).
 *
 * Objetivo: capturar tudo que acontece na casa (compras, tarefas, contas
 * pagas, manutenções concluídas...) para alimentar futuras telas ("O que
 * aconteceu hoje?") e para a IA raciocinar sobre hábitos.
 *
 * Nesta sprint NÃO existe tela nem persistência: mantemos um buffer em
 * memória com os últimos N eventos, expondo uma API estável para leitura.
 * Quando decidirmos persistir, basta trocar a implementação por
 * `insert into public.house_history (...)` sem tocar em quem chama.
 */
import type { DomainEvent } from "@/automation/events";

export type HistoryEntry = {
  id: string;
  at: string;
  event: DomainEvent;
  summary: string;
};

const MAX_ENTRIES = 200;
const buffer: HistoryEntry[] = [];

export function recordHistoryEntry(event: DomainEvent): HistoryEntry {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    event,
    summary: summarize(event),
  };
  buffer.unshift(entry);
  if (buffer.length > MAX_ENTRIES) buffer.length = MAX_ENTRIES;
  return entry;
}

export function listHouseHistory(limit = 50): HistoryEntry[] {
  return buffer.slice(0, limit);
}

export function clearHouseHistory(): void {
  buffer.length = 0;
}

function summarize(event: DomainEvent): string {
  switch (event.type) {
    case "task.completed":
      return `Tarefa concluída: ${event.title}`;
    case "shopping.completed":
      return `Comprou: ${event.name}${event.quantity > 1 ? ` ×${event.quantity}` : ""}`;
    case "expense.created":
      return `Despesa criada: ${event.description}`;
    case "maintenance.completed":
      return `Manutenção concluída: ${event.name}`;
    case "event.created":
      return `Novo compromisso: ${event.title}`;
    case "home.created":
      return `Casa criada: ${event.name}`;
    case "home.updated":
      return `Casa renomeada: ${event.name}`;
    case "home.settingsUpdated":
      return "Configurações da casa atualizadas";
    case "home.switched":
      return `Entrou na casa: ${event.name}`;
    case "member.joined":
      return "Novo morador entrou na casa";
    case "member.left":
      return "Um morador saiu da casa";
    case "member.roleChanged":
      return `Papel de morador alterado para ${event.role}`;
    case "invite.created":
      return `Convite enviado para ${event.email}`;
    case "invite.revoked":
      return "Convite cancelado";
    case "invite.accepted":
      return "Convite aceito";
    default:
      return "Atividade na casa";
  }
}
