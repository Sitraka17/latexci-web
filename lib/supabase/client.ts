import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Fallback values let the module load at build/SSR time without crashing.
// Real calls to auth/db will simply return errors when env vars are missing.
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "https://placeholder.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON);
}

/** True only when Supabase is actually configured */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
