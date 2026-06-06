import {
 buildVocabCorePatch,
 getAuthenticatedSupabase,
 handlePatchResult,
 invalidPayloadResponse,
 jsonError,
 type NodeEditRouteContext,
} from "@/features/hanzihome/server/node-edit";
import { updateVocabCorePayloadSchema } from "@/features/hanzihome/schemas/node-edit.schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
 request: Request,
 context: NodeEditRouteContext<"vocabId">,
) {
 const { vocabId } = await context.params;
 const { supabase, user } = await getAuthenticatedSupabase();

 if (!user) return jsonError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsed = updateVocabCorePayloadSchema.safeParse(body);

 if (!parsed.success) return invalidPayloadResponse(parsed.error);

 const { data, error } = await supabase
  .from("hanzihome_vocab_items")
  .update(buildVocabCorePatch(parsed.data))
  .eq("id", vocabId)
  .select(
   "id, lesson_id, course_id, book_id, owner_id, source, item_order, word, pinyin, han_viet, meaning, category, level, pos_vi, pos_zh, tone, source_file, imported_at, created_at, updated_at",
  )
  .maybeSingle();

 return handlePatchResult(data, error, "vocab item");
}
