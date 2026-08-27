import { Link } from "@tanstack/react-router";
import { Calendar, Wrench, Wallet } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";
import type { TimelineEntry } from "../utils/timeline";
import { formatShortDay, formatTime } from "@/shared/utils/format";

const ICONS = { event: Calendar, maintenance: Wrench, expense: Wallet } as const;
const ROUTES = { event: "/calendario", maintenance: "/manutencao", expense: "/financeiro" } as const;

interface Props { entries: TimelineEntry[]; }

export function TimelineSection({ entries }: Props) {
  if (entries.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-sage-800/50">Próximos dias</h2>
      <CardBlock className="p-2">
        <ol className="divide-y divide-black/5">
          {entries.map((e) => {
            const Icon = ICONS[e.kind];
            const d = new Date(e.date);
            return (
              <li key={e.id}>
                <Link to={ROUTES[e.kind]} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-sage-50">
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-sage-100 py-1.5">
                    <span className="text-[10px] font-medium uppercase text-sage-800/60">{formatShortDay(d.toISOString().slice(0, 10))}</span>
                    <span className="text-xs font-semibold text-sage-800">{formatTime(d)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sage-800">{e.title}</p>
                    {e.meta && <p className="truncate text-xs text-sage-800/50">{e.meta}</p>}
                  </div>
                  <Icon className="size-4 shrink-0 text-sage-800/30" strokeWidth={2} />
                </Link>
              </li>
            );
          })}
        </ol>
      </CardBlock>
    </div>
  );
}
