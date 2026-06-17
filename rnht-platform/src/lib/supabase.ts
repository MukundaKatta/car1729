import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// When env vars are missing (e.g. static builds), supabase is null.
// All consuming code should handle this gracefully.
const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Honestly typed as possibly-null: it IS null when env vars are missing (static
// builds / misconfig). Consumers must guard with `if (!supabase) ...`; the type
// now enforces that instead of a NonNullable cast hiding it (RN-082/155).
export const supabase = supabaseClient;

// Return type is inferred (SupabaseClient<...> | null) from the real
// createClient() call — do NOT annotate with ReturnType<typeof createClient>,
// which resolves the schema generic to `never` and breaks .from().insert().
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey);
}
