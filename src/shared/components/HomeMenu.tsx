import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Home as HomeIcon,
  CheckSquare,
  ShoppingCart,
  Wallet,
  Calendar,
  Wrench,
  Heart,
  Users,
  Sparkles,
  Settings,
  User,
  Repeat,
  LifeBuoy,
  LogOut,
  Check,
  Tag,
} from "lucide-react";
import { useHomeContext } from "@/shared/context/HomeContext";
import { signOut as signOutService } from "@/shared/services/auth.service";

type Item = { to: string; label: string; icon: typeof HomeIcon };

const GROUPS: { title: string; items: readonly Item[] }[] = [
  {
    title: "Casa",
    items: [
      { to: "/", label: "Início", icon: HomeIcon },
      { to: "/calendario", label: "Agenda", icon: Calendar },
      { to: "/memorias", label: "Memórias", icon: Heart },
      { to: "/manutencao", label: "Manutenção", icon: Wrench },
    ],
  },
  {
    title: "Organização",
    items: [
      { to: "/tarefas", label: "Tarefas", icon: CheckSquare },
      { to: "/compras", label: "Compras", icon: ShoppingCart },
      { to: "/categorias", label: "Categorias", icon: Tag },
    ],
  },
  {
    title: "Financeiro",
    items: [{ to: "/financeiro", label: "Receitas e despesas", icon: Wallet }],
  },
  {
    title: "Família",
    items: [{ to: "/familia", label: "Moradores e convites", icon: Users }],
  },
  {
    title: "IA",
    items: [{ to: "/ia", label: "IA da Casa", icon: Sparkles }],
  },
  {
    title: "Conta",
    items: [
      { to: "/configuracoes", label: "Configurações da Casa", icon: Settings },
      { to: "/perfil", label: "Meu Perfil", icon: User },
      { to: "/ajuda", label: "Ajuda", icon: LifeBuoy },
    ],
  },
];

/**
 * Menu da Casa — ponto único de navegação do app (a bottom nav foi removida).
 * Concentra todos os módulos agrupados por assunto e o seletor de casa ativa.
 */
export function HomeMenu() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { home, homes, switchHome } = useHomeContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutService();
    navigate({ to: "/", replace: true });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir menu da casa"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-sage-800 ring-1 ring-black/5"
        >
          <Menu className="size-5" strokeWidth={1.9} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[86vw] max-w-sm overflow-y-auto bg-paper p-0">
        <SheetHeader className="border-b border-black/5 px-5 py-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span aria-hidden>🏠</span>
            <span className="truncate">{home?.home_name ?? "Sem casa ativa"}</span>
          </SheetTitle>
          <p className="text-xs text-sage-800/60">
            {home ? roleLabel(home.role) : "Crie ou entre em uma casa"}
          </p>
        </SheetHeader>

        <nav className="px-3 pb-6 pt-2">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <SectionLabel>{group.title}</SectionLabel>
              {group.items.map((item) => (
                <MenuLink
                  key={`${group.title}-${item.to}-${item.label}`}
                  {...item}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          ))}

          <SectionLabel>Trocar casa</SectionLabel>
          <ul className="space-y-1">
            {homes.map((h) => {
              const active = h.home_id === home?.home_id;
              return (
                <li key={h.home_id}>
                  <button
                    disabled={switching}
                    onClick={async () => {
                      if (active) return setOpen(false);
                      setSwitching(true);
                      try {
                        await switchHome(h.home_id);
                        setOpen(false);
                      } finally {
                        setSwitching(false);
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm hover:bg-white"
                  >
                    <Repeat className="size-4 text-sage-800/50" />
                    <span className="flex-1 truncate">{h.home_name}</span>
                    {active && <Check className="size-4 text-sage-800" />}
                  </button>
                </li>
              );
            })}
            <li>
              <Link
                to="/onboarding"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-sage-800/70 hover:bg-white"
              >
                <HomeIcon className="size-4 text-sage-800/50" />
                Criar ou entrar em outra casa
              </Link>
            </li>
          </ul>

          <button
            onClick={handleSignOut}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-clay-600 hover:bg-white"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function roleLabel(role: string): string {
  if (role === "owner") return "Proprietário";
  if (role === "admin") return "Administrador";
  return "Membro";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sage-800/40">
      {children}
    </p>
  );
}

function MenuLink({
  to,
  label,
  icon: Icon,
  onNavigate,
}: Item & { onNavigate: () => void }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "bg-white font-semibold" }}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-sage-900 hover:bg-white"
    >
      <Icon className="size-4 text-sage-800/60" />
      {label}
    </Link>
  );
}
