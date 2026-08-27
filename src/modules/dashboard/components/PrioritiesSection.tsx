import { Link } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";
import { entityVisual } from "@/shared/utils/entity-visuals";
import type { PriorityItem } from "../utils/priorities";

interface Props { items: PriorityItem[]; }

export function PrioritiesSection({ items }: Props) {
  if (items.length === 0) {
    return (
      <CardBlock className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage-100">
          <CheckSquare className="size-5 text-sage-800" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Sem prioridades urgentes</h2>
          <p className="text-xs text-sage-800/60">Tudo tranquilo por aqui.</p>
        </div>
      </CardBlock>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-sage-800/50">Prioridades do dia</h2>
        <span className="text-xs text-sage-800/40">{items.length}</span>
      </div>
      <CardBlock className="p-2">
        <ul className="divide-y divide-black/5">
          {items.map((p) => {
            const visual = entityVisual(p.kind);
            const Icon = visual.icon;
            const critical = p.severity === 3;
            return (
              <li key={p.id} className="relative">
                <Link
                  to={p.route}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-sage-50"
                >
                  {/* Barra de urgência: só aparece em itens críticos. */}
                  <span
                    className={`absolute inset-y-2 left-0 w-0.5 rounded-full ${critical ? "bg-clay-600" : "bg-transparent"}`}
                    aria-hidden
                  />
                  <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${visual.chip}`}>
                    <Icon className="size-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sage-800">{p.label}</p>
                    <p className={`truncate text-xs ${critical ? "text-clay-600" : "text-sage-800/60"}`}>
                      {visual.label} • {p.detail}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardBlock>
    </div>
  );
}
