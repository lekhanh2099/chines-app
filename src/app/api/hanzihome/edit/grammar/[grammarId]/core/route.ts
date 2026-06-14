import {
 buildGrammarCorePatch,
 getAuthenticatedSupabase,
 handlePatchResult,
 invalidPayloadResponse,
 jsonError,
 type NodeEditRouteContext,
} from "@/features/hanzihome/server/node-edit";
import { updateGrammarCorePayloadSchema } from "@/features/hanzihome/schemas/node-edit.schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: Request, context: NodeEditRouteContext<"grammarId">) {
 const { grammarId } = await context.params;
 const { supabase, user } = await getAuthenticatedSupabase();

 if (!user) return jsonError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsed = updateGrammarCorePayloadSchema.safeParse(body);

 if (!parsed.success) return invalidPayloadResponse(parsed.error);

 const { data, error } = await supabase
  .from("hanzihome_grammar_points")
  .update(buildGrammarCorePatch(parsed.data))
  .eq("id", grammarId)
  .select(
   "id, lesson_id, course_id, book_id, owner_id, source, point_order, title, clean_title, core, content_md, structures_view, notes, imported_at, created_at, updated_at",
  )
  .maybeSingle();

 return handlePatchResult(data, error, "grammar point");
}
