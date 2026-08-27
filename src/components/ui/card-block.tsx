import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  variant?: "white" | "sage" | "dark" | "outline";
}

export function CardBlock({ children, className, variant = "white" }: Props) {
  const styles = {
    white: "bg-white ring-1 ring-black/5",
    sage: "bg-sage-100 ring-1 ring-black/5",
    dark: "bg-sage-800 text-sage-50 ring-1 ring-black/5",
    outline: "bg-transparent ring-1 ring-sage-200",
  } as const;
  return (
    <div className={cn("rounded-[2rem] p-5", styles[variant], className)}>
      {children}
    </div>
  );
}
