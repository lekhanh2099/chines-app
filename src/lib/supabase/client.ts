import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

import { publicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/supabase.generated";

let browserClient: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
 if (browserClient) return browserClient;

 browserClient = createBrowserClient<Database>(publicSupabaseEnv.url, publicSupabaseEnv.key);
 return browserClient;
}
