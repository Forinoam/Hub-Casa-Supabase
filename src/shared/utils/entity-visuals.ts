/**
 * Identidade visual compartilhada por tipo de registro. Usada pelo Dashboard
 * (prioridades, timeline) para que o usuário reconheça o tipo do item sem
 * precisar ler o texto — mantendo a paleta discreta do app.
 */
import {
  CheckSquare,
  CalendarDays,
  ShoppingCart,
  Receipt,
  CreditCard,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

export type EntityKind = "task" | "event" | "shopping" | "bill" | "spend" | "maintenance";

type Visual = {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Classes de fundo + texto do "chip" do ícone. */
  chip: string;
  route: string;
};

export const ENTITY_VISUALS: Record<EntityKind, Visual> = {
  task: {
    label: "Tarefa",
    icon: CheckSquare,
    chip: "bg-sage-100 text-sage-800",
    route: "/tarefas",
  },
  event: {
    label: "Compromisso",
    icon: CalendarDays,
    chip: "bg-[#5F7A8B]/15 text-[#4A6373]",
    route: "/calendario",
  },
  shopping: {
    label: "Compra",
    icon: ShoppingCart,
    chip: "bg-[#7A9E7E]/18 text-[#4F7154]",
    route: "/compras",
  },
  bill: {
    label: "Conta",
    icon: Receipt,
    chip: "bg-clay-600/15 text-clay-600",
    route: "/financeiro",
  },
  spend: {
    label: "Gasto",
    icon: CreditCard,
    chip: "bg-[#D4A574]/25 text-[#8A6437]",
    route: "/financeiro",
  },
  maintenance: {
    label: "Manutenção",
    icon: Wrench,
    chip: "bg-[#A87B94]/18 text-[#7A5468]",
    route: "/manutencao",
  },
};

export function entityVisual(kind: EntityKind): Visual {
  return ENTITY_VISUALS[kind] ?? ENTITY_VISUALS.task;
}
