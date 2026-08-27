import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";
import type { Memory } from "@/shared/types";

interface Props { memory: Memory | null; }

export function MemoryFlashback({ memory }: Props) {
  if (!memory) return null;
  const years = new Date().getFullYear() - new Date(`${memory.date}T00:00:00`).getFullYear();
  return (
    <Link to="/memorias">
      <CardBlock variant="outline" className="flex items-center gap-3 p-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-clay-600/10">
          <Heart className="size-4 text-clay-600" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sage-800/50">
            {years === 1 ? "Há 1 ano" : `Há ${years} anos`}
          </span>
          <p className="truncate text-sm font-medium text-sage-800">{memory.title}</p>
        </div>
      </CardBlock>
    </Link>
  );
}
