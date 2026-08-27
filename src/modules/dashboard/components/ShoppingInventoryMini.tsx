import { Link } from "@tanstack/react-router";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { CardBlock } from "@/components/ui/card-block";

interface Props { pendingShopping: number; }

export function ShoppingInventoryMini({ pendingShopping }: Props) {
  if (pendingShopping === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3">
      <Link to="/compras">
        <CardBlock className="flex items-center gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage-100">
            <ShoppingCart className="size-4 text-sage-800" strokeWidth={2} />
          </div>
          <p className="flex-1 text-sm font-medium text-sage-800">
            {pendingShopping} {pendingShopping === 1 ? "item aguardando compra" : "itens aguardando compra"}
          </p>
          <ChevronRight className="size-4 text-sage-800/30" />
        </CardBlock>
      </Link>
    </div>
  );
}
