import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/supabase.generated";

export async function createClient() {
 const cookieStore = await cookies();

 return createServerClient<Database>(publicSupabaseEnv.url, publicSupabaseEnv.key, {
  cookies: {
   getAll() {
    return cookieStore.getAll();
   },
   setAll(cookiesToSet) {
    try {
     cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
    } catch {
     // The `setAll` method was called from a Server Component.
     // This can be ignored if you have middleware refreshing
     // user sessions.
    }
   },
  },
 });
}
