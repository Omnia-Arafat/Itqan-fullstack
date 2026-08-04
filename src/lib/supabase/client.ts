import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Browser client — anon key only. Every student-facing operation goes through a
 * SECURITY DEFINER RPC, so this key never needs elevated rights.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
