/**
 * Casa Hub automation bus — a tiny in-process pub/sub used to wire modules
 * together without direct imports. Services/hooks call `emit(event)` after a
 * successful mutation; handlers registered under `./handlers/` react and can
 * touch other modules via the shared `AutomationContext`.
 *
 * The bus is intentionally minimal (sync dispatch, isolated handler errors)
 * so it can grow into a queued/server-side worker later without a rewrite.
 */
import type { QueryClient } from "@tanstack/react-query";
import type { DomainEvent, DomainEventType, EventOf } from "./events";

export type AutomationContext = {
  queryClient: QueryClient;
};

export type Handler<T extends DomainEventType = DomainEventType> = (
  event: EventOf<T>,
  ctx: AutomationContext,
) => void | Promise<void>;

type AnyHandler = (event: DomainEvent, ctx: AutomationContext) => void | Promise<void>;

const subscribers = new Map<DomainEventType | "*", Set<AnyHandler>>();
let currentContext: AutomationContext | null = null;

export function setAutomationContext(ctx: AutomationContext | null): void {
  currentContext = ctx;
}

export function subscribe<T extends DomainEventType>(type: T, handler: Handler<T>): () => void;
export function subscribe(type: "*", handler: Handler): () => void;
export function subscribe(type: DomainEventType | "*", handler: AnyHandler): () => void {
  const set = subscribers.get(type) ?? new Set<AnyHandler>();
  set.add(handler);
  subscribers.set(type, set);
  return () => set.delete(handler);
}

export function emit(event: DomainEvent): void {
  const ctx = currentContext;
  if (!ctx) {
    // Bus not wired yet (e.g. SSR): drop silently — mutations still succeed.
    return;
  }
  const targets = [
    ...(subscribers.get(event.type) ?? []),
    ...(subscribers.get("*") ?? []),
  ];
  for (const handler of targets) {
    try {
      const result = handler(event, ctx);
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch((error) => {
          console.error(`[automation] handler failed for ${event.type}`, error);
        });
      }
    } catch (error) {
      console.error(`[automation] handler threw for ${event.type}`, error);
    }
  }
}
