import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckSquare, ShoppingCart, Wallet, Wrench } from "lucide-react";
import type { ComponentType } from "react";
import { CardBlock } from "@/components/ui/card-block";
import type { HouseIndex } from "../utils/houseIndex";
import { getGreeting, formatFullDate } from "@/shared/utils/format";

interface Props {
  name: string;
  house: HouseIndex;
  headline: string;
  criticalCount: number;
  areas: {
    overdueTasks: number;
    pendingTasks: number;
    pendingShopping: number;
    overdueBills: number;
    maintenanceDue: boolean;
    upcomingEvents: number;
  };
}

type Chip = {
  id: string;
  label: string;
  value: string;
  route: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  alert: boolean;
};

/**
 * Top-of-dashboard "situação atual" card. Communicates the current mood of
 * the home in plain language — no abstract 0–100 score — plus where the
 * attention is needed and a direct way to act on it.
 */
export function HeroCard({ name, house, headline, criticalCount, areas }: Props) {
  const dotColor =
    house.tone === "clay" ? "bg-clay-600" : house.tone === "amber" ? "bg-amber-400" : "bg-sage-200";

  const chips: Chip[] = [
    {
      id: "tasks",
      label: "Tarefas",
      value: areas.overdueTasks > 0
        ? `${areas.overdueTasks} atrasada${areas.overdueTasks === 1 ? "" : "s"}`
        : areas.pendingTasks > 0
          ? `${areas.pendingTasks} pendente${areas.pendingTasks === 1 ? "" : "s"}`
          : "em dia",
      route: "/tarefas",
      icon: CheckSquare,
      alert: areas.overdueTasks > 0,
    },
    {
      id: "shopping",
      label: "Compras",
      value: areas.pendingShopping > 0 ? `${areas.pendingShopping} na lista` : "em dia",
      route: "/compras",
      icon: ShoppingCart,
      alert: false,
    },
    {
      id: "finance",
      label: "Contas",
      value: areas.overdueBills > 0
        ? `${areas.overdueBills} vencida${areas.overdueBills === 1 ? "" : "s"}`
        : "em dia",
      route: "/financeiro",
      icon: Wallet,
      alert: areas.overdueBills > 0,
    },
    {
      id: "agenda",
      label: "Agenda",
      value: areas.upcomingEvents > 0
        ? `${areas.upcomingEvents} próximo${areas.upcomingEvents === 1 ? "" : "s"}`
        : "livre",
      route: "/calendario",
      icon: Calendar,
      alert: false,
    },
    {
      id: "maintenance",
      label: "Manutenção",
      value: areas.maintenanceDue ? "próxima perto" : "em dia",
      route: "/manutencao",
      icon: Wrench,
      alert: areas.maintenanceDue,
    },
  ];

  const scrollToPriorities = () => {
    document.getElementById("prioridades")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <CardBlock variant="dark" className="relative overflow-hidden p-6">
      <span className="text-xs font-medium uppercase tracking-widest opacity-70">
        {formatFullDate()}
      </span>
      <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-balance">
        {getGreeting()}, {name}
      </h1>
      <p className="mt-2 text-base leading-snug text-sage-50/85 text-pretty">{headline}</p>

      <div className="mt-6 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-2.5">
          <span className={`size-2.5 shrink-0 rounded-full ${dotColor}`} />
          <p className="text-lg font-semibold leading-tight">{house.label}</p>
        </div>

        <p className="mt-1.5 text-sm text-sage-50/80">
          {criticalCount > 0
            ? `${criticalCount} ponto${criticalCount === 1 ? "" : "s"} exige${criticalCount === 1 ? "" : "m"} sua atenção hoje`
            : "Nada urgente agora. Bom momento para respirar."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.id}
              to={chip.route}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition active:scale-[0.98] ${
                chip.alert
                  ? "bg-clay-600/25 text-sage-50 ring-clay-600/40"
                  : "bg-white/8 text-sage-50/80 ring-white/10"
              }`}
            >
              <chip.icon className="size-3.5" strokeWidth={2} />
              <span>{chip.label}</span>
              <span className="opacity-70">·</span>
              <span>{chip.value}</span>
            </Link>
          ))}
        </div>

        {criticalCount > 0 && (
          <button
            type="button"
            onClick={scrollToPriorities}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-xs font-semibold text-sage-800 transition active:scale-[0.98]"
          >
            Ver o que precisa de atenção <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </CardBlock>
  );
}
