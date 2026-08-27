import { supabase } from "@/integrations/supabase/client";
import { toUserMessage } from "@/shared/utils/errors";

/**
 * Home service — the single source of truth for "which house am I in?".
 *
 * Every module reads the active home through the Home Context
 * (`src/shared/context/HomeContext.tsx`), which is powered by this service.
 * No module should query `home_members` directly.
 */

export type HomeRole = "owner" | "admin" | "member";

export type HomeSettings = {
  /** Add purchased shopping items to the pantry automatically. */
  /** Ask before creating expenses/purchases automatically. */
  confirmAutomations: boolean;
  /** Allow the insight engine to surface smart suggestions. */
  smartSuggestions: boolean;
  /** Keep the House Index recalculating in real time. */
  autoHouseIndex: boolean;
};

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  confirmAutomations: false,
  smartSuggestions: true,
  autoHouseIndex: true,
};

export type HomeMembership = {
  home_id: string;
  home_name: string;
  role: HomeRole;
  created_by: string;
  joined_at: string;
  settings: HomeSettings;
};

export type HomeContextSnapshot = {
  homes: HomeMembership[];
  activeHomeId: string | null;
};

const STORAGE_KEY = "casahub.activeHomeId";

export function readStoredHomeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredHomeId(homeId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (homeId) window.localStorage.setItem(STORAGE_KEY, homeId);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — profile persistence still applies */
  }
}

function normalizeRole(role: string | null): HomeRole {
  return role === "owner" || role === "admin" ? role : "member";
}

function parseSettings(raw: unknown): HomeSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_HOME_SETTINGS };
  return { ...DEFAULT_HOME_SETTINGS, ...(raw as Partial<HomeSettings>) };
}

/** Idempotently guarantees the caller has a profile row. Returns the user. */
async function ensureProfile() {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = userData.user;
  if (!user) return null;

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Morador";

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
  if (error) throw error;
  return user;
}

/**
 * Loads every house the user belongs to plus the resolved active house.
 * Resolution order: localStorage → profile.active_home_id → first membership.
 * The resolved id is written back to both stores so the choice survives
 * reloads and follows the user across devices.
 */
export async function loadHomeContext(): Promise<HomeContextSnapshot> {
  const user = await ensureProfile();
  if (!user) return { homes: [], activeHomeId: null };

  const [{ data: memberRows, error }, { data: profileRow }] = await Promise.all([
    supabase
      .from("home_members")
      .select("home_id, role, created_at, homes(name, created_by, settings)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("active_home_id").eq("id", user.id).maybeSingle(),
  ]);
  if (error) throw error;

  const homes: HomeMembership[] = (memberRows ?? []).map((row) => {
    const home = row.homes as unknown as
      | { name: string | null; created_by: string; settings: unknown }
      | null;
    return {
      home_id: row.home_id,
      home_name: home?.name ?? "Minha casa",
      role: normalizeRole(row.role),
      created_by: home?.created_by ?? "",
      joined_at: row.created_at,
      settings: parseSettings(home?.settings),
    };
  });

  if (homes.length === 0) {
    writeStoredHomeId(null);
    return { homes, activeHomeId: null };
  }

  const candidates = [readStoredHomeId(), profileRow?.active_home_id ?? null];
  const resolved =
    candidates.find((id) => id && homes.some((h) => h.home_id === id)) ?? homes[0].home_id;

  writeStoredHomeId(resolved);
  if (profileRow?.active_home_id !== resolved) {
    await supabase.from("profiles").update({ active_home_id: resolved }).eq("id", user.id);
  }

  return { homes, activeHomeId: resolved };
}

/** Persists the active house (profile + local storage). */
export async function persistActiveHome(homeId: string): Promise<void> {
  writeStoredHomeId(homeId);
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("profiles").update({ active_home_id: homeId }).eq("id", data.user.id);
}

/**
 * Resolves the caller's active home. Used by the route guard (outside React)
 * and kept for backwards compatibility with existing callers.
 */
export async function getCurrentHome(): Promise<HomeMembership | null> {
  const { homes, activeHomeId } = await loadHomeContext();
  return homes.find((h) => h.home_id === activeHomeId) ?? homes[0] ?? null;
}

export async function createNewHome(homeName: string): Promise<HomeMembership> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!userData.user) throw new Error("Usuário não autenticado");

  const { data: createdHome, error: homeError } = await supabase
    .from("homes")
    .insert({ name: homeName, created_by: userData.user.id })
    .select("id, name, created_by, settings")
    .single();
  if (homeError) throw new Error(toUserMessage(homeError, "Erro ao criar casa."));

  const { data: createdMember, error: memberError } = await supabase
    .from("home_members")
    .insert({ home_id: createdHome.id, user_id: userData.user.id, role: "owner" })
    .select("home_id, role, created_at")
    .single();
  if (memberError) throw new Error(toUserMessage(memberError, "Erro ao entrar na casa."));

  await persistActiveHome(createdHome.id);

  return {
    home_id: createdMember.home_id,
    home_name: createdHome.name ?? "Minha casa",
    role: normalizeRole(createdMember.role),
    created_by: createdHome.created_by,
    joined_at: createdMember.created_at,
    settings: parseSettings(createdHome.settings),
  };
}

export async function renameHome(homeId: string, name: string): Promise<void> {
  const { error } = await supabase.from("homes").update({ name }).eq("id", homeId);
  if (error) throw new Error(toUserMessage(error, "Não consegui renomear a casa."));
}

export async function updateHomeSettings(
  homeId: string,
  settings: HomeSettings,
): Promise<void> {
  const { error } = await supabase
    .from("homes")
    .update({ settings: settings as unknown as Record<string, boolean> })
    .eq("id", homeId);
  if (error) throw new Error(toUserMessage(error, "Não consegui salvar as configurações."));
}
