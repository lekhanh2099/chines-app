import {
 buildVocabExamplePatch,
 getAuthenticatedSupabase,
 handlePatchResult,
 invalidPayloadResponse,
 jsonError,
 type NodeEditRouteContext,
} from "@/features/hanzihome/server/node-edit";
import { updateVocabExamplePayloadSchema } from "@/features/hanzihome/schemas/node-edit.schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: Request, context: NodeEditRouteContext<"exampleId">) {
 const { exampleId } = await context.params;
 const { supabase, user } = await getAuthenticatedSupabase();

 if (!user) return jsonError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsed = updateVocabExamplePayloadSchema.safeParse(body);

 if (!parsed.success) return invalidPayloadResponse(parsed.error);

 const { data, error } = await supabase
  .from("hanzihome_vocab_examples")
  .update(buildVocabExamplePatch(parsed.data))
  .eq("id", exampleId)
  .select(
   "id, vocab_item_id, lesson_id, owner_id, source, example_order, zh, pinyin, vi, note, imported_at, created_at, updated_at",
  )
  .maybeSingle();

 return handlePatchResult(data, error, "vocab example");
}
