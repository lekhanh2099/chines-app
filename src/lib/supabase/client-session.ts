import type { SupabaseClient } from "@supabase/supabase-js";

export async function getClientSessionUser(supabase: {
 auth: Pick<SupabaseClient["auth"], "getSession">;
}) {
 try {
  const {
   data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
 } catch {
  return null;
 }
}
