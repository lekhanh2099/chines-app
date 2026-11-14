import type { SupabaseClient } from "@supabase/supabase-js";

export async function getClientSessionUser(supabase: {
 auth: Pick<SupabaseClient["auth"], "getSession">;
}) {
 if (typeof navigator !== "undefined" && !navigator.onLine) {
  try {
   const sessionResult = await Promise.race([
    supabase.auth.getSession(),
    new Promise<{ data: { session: null } }>((resolve) =>
     setTimeout(() => resolve({ data: { session: null } }), 120),
    ),
   ]);
   return sessionResult.data.session?.user ?? null;
  } catch {
   return null;
  }
 }

 try {
  const {
   data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
 } catch {
  return null;
 }
}
