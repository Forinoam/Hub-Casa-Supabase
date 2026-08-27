import type { Handler } from "../bus";
import { recordHistoryEntry } from "@/modules/history";

/**
 * Every domain event becomes an entry in the house history log. Storage is
 * currently an in-memory ring buffer (see `history.service.ts`); a future
 * migration will persist it to Supabase without touching this handler.
 */
export const handleHistoryLog: Handler = (event) => {
  recordHistoryEntry(event);
};
