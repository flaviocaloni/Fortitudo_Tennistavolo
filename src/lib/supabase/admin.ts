import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client con service role key: bypassa le RLS e dà accesso all'API
 * amministrativa di Auth (lista utenti, creazione, password).
 * SOLO lato server — la chiave non ha il prefisso NEXT_PUBLIC_.
 * Restituisce null se la chiave non è configurata: le pagine devono
 * degradare con un avviso, non rompersi.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
