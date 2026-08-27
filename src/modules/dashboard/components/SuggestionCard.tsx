import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CardBlock } from "@/components/ui/card-block";

interface Props { message: string; }

/**
 * "Sugestão do Casa Hub" — o card inteiro é um botão: abre a IA da Casa já
 * com o contexto do dashboard (prioridades, pendências, índice) carregado.
 */
export function SuggestionCard({ message }: Props) {
  return (
    <Link to="/ia" search={{ auto: true }} className="block">
      <CardBlock variant="sage" className="flex items-start gap-3 p-4 transition active:scale-[0.99]">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-black/5">
          <Sparkles className="size-4 text-clay-600" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sage-800/50">
            Sugestão do Casa Hub
          </span>
          <p className="mt-1 text-sm leading-snug text-sage-800 text-pretty">{message}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-clay-600">
            Conversar com a IA <ArrowRight className="size-3" />
          </span>
        </div>
      </CardBlock>
    </Link>
  );
}
