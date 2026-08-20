import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase.generated";

export async function hasHanziHomeContentCapability(
 supabase: SupabaseClient<Database>,
 userId: string,
): Promise<boolean> {
 const { data, error } = await supabase
  .from("hanzihome_content_roles")
  .select("role")
  .eq("user_id", userId)
  .maybeSingle();

 if (error) throw new Error(error.message);
 return data?.role === "editor" || data?.role === "admin";
}
