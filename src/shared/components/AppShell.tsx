import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HomeMenu } from "./HomeMenu";
import { useHomeContext } from "@/shared/context/HomeContext";
import { UniversalSearch } from "./UniversalSearch";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Cabeçalho único do app: ☰ Menu + 🏠 Nome da Casa.
 * O nome da casa é o próprio "Início" — leva ao Dashboard.
 */
export function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const { home, isLoading } = useHomeContext();

  return (
    <div className="min-h-screen bg-paper pb-16">
      <UniversalSearch />
      <header className="sticky top-0 z-40 border-b border-black/5 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[56ch] items-center gap-3 px-6 py-3">
          <HomeMenu />
          <Link
            to="/"
            aria-label="Ir para o início"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold text-sage-800 transition hover:bg-white"
          >
            <span aria-hidden>🏠</span>
            <span className="truncate">
              {isLoading ? "Carregando…" : (home?.home_name ?? "Sem casa ativa")}
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[56ch] px-6 pt-6">
        {(title || action) && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {subtitle && (
                <span className="text-sm font-medium tracking-tight text-sage-800/60">
                  {subtitle}
                </span>
              )}
              {title && (
                <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-balance">
                  {title}
                </h1>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
