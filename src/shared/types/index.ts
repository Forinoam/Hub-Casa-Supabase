/**
 * Shared row types derived from the generated Supabase schema.
 */
import type { Database } from "@/integrations/supabase/types";

type Tbl = Database["public"]["Tables"];

export type Task = Tbl["tasks"]["Row"];
export type ShoppingItem = Tbl["shopping_items"]["Row"];
export type Event = Tbl["events"]["Row"];
export type Expense = Tbl["expenses"]["Row"];
export type Income = Tbl["incomes"]["Row"];
export type Budget = Tbl["budgets"]["Row"];
export type PaymentCard = Tbl["payment_cards"]["Row"];

export type MaintenanceItem = Tbl["maintenance_items"]["Row"];
export type Memory = Tbl["memories"]["Row"];
export type Category = Tbl["categories"]["Row"];
export type HomeMember = Tbl["home_members"]["Row"];
export type Profile = Tbl["profiles"]["Row"];

export type MemberWithProfile = {
  user_id: string;
  role: string;
  joined_at?: string;
  name: string;
  avatar_url: string | null;
};
