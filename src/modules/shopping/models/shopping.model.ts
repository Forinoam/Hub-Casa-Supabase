import type { ShoppingItem } from "@/shared/types";

export const ShoppingModel = {
  isBought(item: Pick<ShoppingItem, "bought">): boolean {
    return !!item.bought;
  },
  isPending(item: Pick<ShoppingItem, "bought">): boolean {
    return !item.bought;
  },
};
