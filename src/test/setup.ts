/** Setup global das suítes de teste (Vitest + jsdom). */
import { vi } from "vitest";

// Silencia o cliente Supabase real em qualquer import acidental.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      throw new Error("Supabase real não deve ser usado nos testes.");
    },
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  },
}));
