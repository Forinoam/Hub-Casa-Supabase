import { Link } from "@tanstack/react-router";
import { Plus, CheckSquare, ShoppingCart, Wallet, Calendar, Wrench } from "lucide-react";

const actions = [
  { to: "/tarefas", label: "Tarefa", icon: CheckSquare },
  { to: "/compras", label: "Compra", icon: ShoppingCart },
  { to: "/financeiro", label: "Gasto", icon: Wallet },
  { to: "/calendario", label: "Compromisso", icon: Calendar },
  { to: "/manutencao", label: "Manutenção", icon: Wrench },
] as const;

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-sage-800/50">
        Ações rápidas
      </h2>
      {/* Scroll horizontal: sangra até a borda da tela para o gesto de swipe
          funcionar naturalmente no mobile, sem snap travando o arrasto. */}
      <div className="-mx-6 overflow-x-auto overscroll-x-contain px-6 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 touch-pan-x">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-sage-800 shadow-sm ring-1 ring-black/5 transition hover:bg-sage-50"
            >
              <span className="grid size-6 place-items-center rounded-full bg-sage-800 text-white">
                <Plus className="size-3.5" strokeWidth={3} />
              </span>
              <a.icon className="size-4 text-sage-800/60" strokeWidth={2} />
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
