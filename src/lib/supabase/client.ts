import { createBrowserClient } from "@supabase/ssr";

import { publicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/supabase.generated";

export function createClient() {
 return createBrowserClient<Database>(publicSupabaseEnv.url, publicSupabaseEnv.key);
}
