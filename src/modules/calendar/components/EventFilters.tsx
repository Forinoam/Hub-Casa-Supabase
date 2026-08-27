import type { ReactNode } from "react";
import type { EventFilter } from "../models/event.model";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
        active ? "bg-sage-800 text-sage-50" : "bg-white ring-1 ring-black/5"
      }`}
    >
      {children}
    </button>
  );
}

export function EventFilters({
  value,
  onChange,
  members,
}: {
  value: EventFilter;
  onChange: (filter: EventFilter) => void;
  members: Array<{ user_id: string; name: string }>;
}) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <FilterChip active={value === "all"} onClick={() => onChange("all")}>
        Todos
      </FilterChip>
      <FilterChip active={value === "mine"} onClick={() => onChange("mine")}>
        Meus
      </FilterChip>
      <FilterChip active={value === "shared"} onClick={() => onChange("shared")}>
        Da casa
      </FilterChip>
      {members.map((m) => (
        <FilterChip key={m.user_id} active={value === m.user_id} onClick={() => onChange(m.user_id)}>
          {m.name}
        </FilterChip>
      ))}
    </div>
  );
}
