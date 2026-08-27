import { cn } from "@/lib/utils";

/**
 * Base classes shared by every form control (input/select/textarea) across
 * the app. Prevents 6 different tailwind variations from drifting apart.
 */
export const FIELD_CLASS =
  "w-full rounded-2xl bg-sage-50 px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-sage-800";

export function fieldClass(extra?: string) {
  return cn(FIELD_CLASS, extra);
}

/**
 * Primary submit button used inside forms/sheets.
 * `pending` renders it disabled with a subdued style.
 */
export function primaryButtonClass(extra?: string) {
  return cn(
    "w-full rounded-full bg-sage-800 py-3 text-sm font-medium text-sage-50 transition disabled:opacity-50",
    extra,
  );
}
