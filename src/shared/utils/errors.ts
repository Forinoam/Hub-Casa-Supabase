import { toast } from "sonner";

export function toUserMessage(err: unknown, fallback = "Ocorreu um erro. Tente novamente."): string {
  if (!err) return fallback;
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  if (typeof err === "string") return err;
  return fallback;
}

export function reportError(scope: string, err: unknown, fallback?: string): string {
  const msg = toUserMessage(err, fallback);
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[Casa OS][${scope}]`, err);
  }
  toast.error(msg);
  return msg;
}

export function assertHomeContext(scope: string, userId?: string, homeId?: string): asserts homeId is string {
  if (!userId) throw new Error("Faça login novamente para continuar.");
  if (!homeId) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[Casa OS][${scope}] missing home_id`);
    }
    throw new Error("Não encontrei uma casa ativa para salvar este registro.");
  }
}
