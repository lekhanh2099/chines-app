import {
 buildVocabDetailSectionPatch,
 getAuthenticatedSupabase,
 handlePatchResult,
 invalidPayloadResponse,
 jsonError,
 type NodeEditRouteContext,
} from "@/features/hanzihome/server/node-edit";
import { updateVocabDetailSectionPayloadSchema } from "@/features/hanzihome/schemas/node-edit.schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
 request: Request,
 context: NodeEditRouteContext<"sectionId">,
) {
 const { sectionId } = await context.params;
 const { supabase, user } = await getAuthenticatedSupabase();

 if (!user) return jsonError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsed = updateVocabDetailSectionPayloadSchema.safeParse(body);

 if (!parsed.success) return invalidPayloadResponse(parsed.error);

 const { data, error } = await supabase
  .from("hanzihome_vocab_detail_sections")
  .update(buildVocabDetailSectionPatch(parsed.data))
  .eq("id", sectionId)
  .select(
   "id, vocab_item_id, lesson_id, owner_id, source, section_key, title, lines, section_order, imported_at, created_at, updated_at",
  )
  .maybeSingle();

 return handlePatchResult(data, error, "vocab detail section");
}
