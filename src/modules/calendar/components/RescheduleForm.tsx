import { fieldClass, primaryButtonClass } from "@/shared/components/form-fields";
import { toLocalInput } from "../models/event.model";

export function RescheduleForm({
  startAt,
  pending,
  onSubmit,
}: {
  startAt: string;
  pending: boolean;
  onSubmit: (startAt: string) => Promise<void> | void;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={async (ev) => {
        ev.preventDefault();
        const value = new FormData(ev.currentTarget).get("start_at") as string;
        if (!value) return;
        await onSubmit(value);
      }}
    >
      <input
        name="start_at"
        type="datetime-local"
        required
        defaultValue={toLocalInput(startAt)}
        className={fieldClass()}
      />
      <button type="submit" className={primaryButtonClass()} disabled={pending}>
        {pending ? "Salvando..." : "Reagendar"}
      </button>
    </form>
  );
}
