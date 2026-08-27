import { Plus, X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

interface RoundIconButtonProps extends Omit<ComponentProps<"button">, "type"> {
  icon?: "plus" | "close";
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
}

const ICONS = { plus: Plus, close: X };

/**
 * Shared "+" / "×" round button used in headers and lists.
 * Standardizes sizing, aria-label, and the primary vs. muted variants
 * that appeared inline in every route.
 */
export function RoundIconButton({
  icon = "plus",
  label,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: RoundIconButtonProps) {
  const Icon = ICONS[icon];
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "grid place-items-center rounded-full transition",
        size === "md" ? "size-10" : "size-8",
        variant === "primary"
          ? "bg-sage-800 text-sage-50 hover:bg-sage-900"
          : "text-sage-800/30 hover:text-sage-800",
        className,
      )}
      {...rest}
    >
      <Icon className={size === "md" ? "size-5" : "size-4"} />
    </button>
  );
}
