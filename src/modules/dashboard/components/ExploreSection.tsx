import { Link } from "@tanstack/react-router";
import { Heart, Sparkles, Users } from "lucide-react";
import type { ComponentType } from "react";

const cards = [
  {
    to: "/memorias",
    label: "Memórias",
    detail: "Guarde os momentos bonitos da casa",
    icon: Heart,
    tint: "bg-clay-600/10 text-clay-600",
  },
  {
    to: "/ia",
    label: "IA da Casa",
    detail: "Peça, pergunte e deixe que ela organiza",
    icon: Sparkles,
    tint: "bg-amber-400/20 text-amber-700",
  },
  {
    to: "/familia",
    label: "Família",
    detail: "Convide quem mora com você",
    icon: Users,
    tint: "bg-sage-800/10 text-sage-800",
  },
] as const satisfies ReadonlyArray<{
  to: string;
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tint: string;
}>;

/**
 * Convite à exploração: destaca as áreas que não aparecem nos números do topo,
 * para a home não ser só uma lista de pendências.
 */
export function ExploreSection() {
  return (
    <div>
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-sage-800/50">
        Para explorar
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group relative overflow-hidden rounded-[2rem] bg-white p-5 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
          >
            <div className={`grid size-10 place-items-center rounded-2xl ${c.tint}`}>
              <c.icon className="size-5" strokeWidth={2} />
            </div>
            <p className="mt-3 text-sm font-semibold text-sage-800">{c.label}</p>
            <p className="mt-1 text-xs leading-snug text-sage-800/55 text-pretty">{c.detail}</p>
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -right-8 size-24 rounded-full bg-sage-100 opacity-0 transition group-hover:opacity-60"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
