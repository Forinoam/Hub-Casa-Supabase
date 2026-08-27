import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckSquare, CalendarDays, ShoppingCart, Wallet } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTasks } from "@/modules/tasks";
import { useUpcomingEvents } from "@/modules/calendar";
import { useShoppingItems } from "@/modules/shopping";
import { useExpenses } from "@/modules/finance";
import { formatCurrency, formatDate, formatDateTime } from "@/shared/utils/format";
import {
  groupByKind,
  searchItems,
  SEARCH_KIND_LABEL,
  type SearchItem,
  type SearchKind,
} from "@/shared/utils/search";

const ICONS: Record<SearchKind, typeof CheckSquare> = {
  task: CheckSquare,
  event: CalendarDays,
  shopping: ShoppingCart,
  bill: Wallet,
};

/** Diálogo de busca universal (Cmd/Ctrl + K) montado no AppShell. */
export function UniversalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: tasks = [] } = useTasks();
  const { data: events = [] } = useUpcomingEvents();
  const { data: shopping = [] } = useShoppingItems();
  const { data: expenses = [] } = useExpenses();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<SearchItem[]>(() => {
    const list: SearchItem[] = [];
    for (const t of tasks) {
      list.push({
        id: t.id,
        kind: "task",
        title: t.title,
        subtitle: t.due_date ? `Vence em ${formatDate(t.due_date)}` : "Sem data",
        to: "/tarefas",
      });
    }
    for (const e of events) {
      list.push({
        id: e.id,
        kind: "event",
        title: e.title,
        subtitle: formatDateTime(e.start_at),
        to: "/calendario",
      });
    }
    for (const s of shopping) {
      list.push({
        id: s.id,
        kind: "shopping",
        title: s.name,
        subtitle: s.category ?? undefined,
        to: "/compras",
      });
    }
    for (const e of expenses) {
      list.push({
        id: e.id,
        kind: "bill",
        title: e.description,
        subtitle: `${formatCurrency(Number(e.amount ?? 0))}${e.due_date ? ` • ${formatDate(e.due_date)}` : ""}`,
        to: "/financeiro",
      });
    }
    return list;
  }, [tasks, events, shopping, expenses]);

  const results = useMemo(() => groupByKind(searchItems(items, query)), [items, query]);

  const go = (item: SearchItem) => {
    setOpen(false);
    setQuery("");
    void navigate({ to: item.to, hash: `item-${item.id}` }).then(() => {
      setTimeout(() => {
        const el = document.getElementById(`item-${item.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar tarefas, compromissos, compras e contas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query && results.length === 0 && <CommandEmpty>Nada encontrado.</CommandEmpty>}
        {results.map(([kind, list]) => {
          const Icon = ICONS[kind];
          return (
            <CommandGroup key={kind} heading={SEARCH_KIND_LABEL[kind]}>
              {list.map((item) => (
                <CommandItem key={`${kind}-${item.id}`} value={`${item.title} ${item.id}`} onSelect={() => go(item)}>
                  <Icon className="mr-2 size-4 opacity-60" />
                  <span className="truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="ml-auto truncate pl-3 text-xs opacity-50">{item.subtitle}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
