import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getClientSessionUser(
 supabase: SupabaseClient,
): Promise<User | null> {
 const {
  data: { session },
 } = await supabase.auth.getSession();

 return session?.user ?? null;
}
