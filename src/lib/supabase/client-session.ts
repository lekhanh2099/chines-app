import type { SupabaseClient } from "@supabase/supabase-js";

export async function getClientSessionUser(supabase: SupabaseClient) {
 const {
  data: { session },
 } = await supabase.auth.getSession();

 return session?.user ?? null;
}
