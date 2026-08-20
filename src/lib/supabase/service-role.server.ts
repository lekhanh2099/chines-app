import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";
import type { Database } from "@/types/supabase.generated";

/**
 * Creates a server-only Supabase client with the configured secret/service-role
 * credential. Callers must derive user identity independently before using this
 * client for user-owned writes because RLS is intentionally bypassed here.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient<Database> {
 return createClient<Database>(publicSupabaseEnv.url, getSupabaseServerSecret(), {
  auth: {
   autoRefreshToken: false,
   persistSession: false,
   detectSessionInUrl: false,
  },
 });
}
