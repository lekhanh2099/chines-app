import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

/**
 * Short-URL redirect: /note/<short_id> → /notes/<uuid>
 * Keeps old UUID-based URLs working too.
 */
export default async function ShortNoteRedirect({
 params,
}: {
 params: Promise<{ shortId: string }>;
}) {
 const { shortId } = await params;
 const supabase = await createClient();
 const { data: authData, error: authError } = await supabase.auth.getUser();

 if (authError || !authData?.user) {
  redirect("/login");
 }

 const { data } = await supabase
  .from("notes")
  .select("id")
  .eq("short_id", shortId)
  .eq("user_id", authData.user.id)
  .single();

 if (!data) {
  notFound();
 }

 redirect(`/notes/${data.id}`);
}
