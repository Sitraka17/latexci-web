import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Returns a Supabase admin client (service-role key, bypasses RLS).
 * Returns null when the required env vars are not configured — callers
 * must handle the null case and return an appropriate HTTP error.
 */
export function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
