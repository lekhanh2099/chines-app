import "server-only";

import { JsonObjectSchema, type JsonObject } from "@/types/json";
import type { createClient } from "@/lib/supabase/server";

export class SectionPayloadRejection extends Error {
 readonly status: number;

 constructor(message: string, status: number) {
  super(message);
  this.name = "SectionPayloadRejection";
  this.status = status;
 }
}

function rejectVocabularyItems(sectionType: string, payload: JsonObject) {
 const items = payload.items;
 // hanzihome_vocab_items is the only vocabulary store; section payloads only
 // keep ordering/metadata (src/features/hanzihome/AGENTS.md).
 if (sectionType === "vocabulary" && Array.isArray(items) && items.length > 0) {
  throw new SectionPayloadRejection("Vocabulary section payload.items must remain empty", 400);
 }
}

/**
 * Section updates send only the payload keys they edit. The read model strips
 * soft-deleted nested nodes and attaches canonical vocabulary, so a client copy
 * of the payload is never safe to write back wholesale. The stored payload is
 * read and the patch merged over it; the mutation RPC still enforces
 * expectedUpdatedAt, so a concurrent write between this read and the update
 * is rejected with 409 rather than overwritten.
 */
export async function mergeSectionPayloadChanges({
 client,
 operation,
 sectionId,
 changes,
}: {
 client: Awaited<ReturnType<typeof createClient>>;
 operation: string;
 sectionId?: string;
 changes: JsonObject;
}): Promise<JsonObject> {
 const payloadPatch = JsonObjectSchema.safeParse(changes.payload);
 if (!payloadPatch.success) return changes;

 if (operation === "create") {
  if (typeof changes.section_type === "string") {
   rejectVocabularyItems(changes.section_type, payloadPatch.data);
  }
  return changes;
 }
 if (operation !== "update" || !sectionId) return changes;

 const { data: row, error } = await client
  .from("hanzihome_lesson_sections")
  .select("payload, section_type")
  .eq("id", sectionId)
  .maybeSingle();
 if (error) throw new SectionPayloadRejection(error.message, 500);
 if (!row) throw new SectionPayloadRejection("Section not found", 404);

 rejectVocabularyItems(row.section_type, payloadPatch.data);
 const storedPayload = JsonObjectSchema.parse(row.payload);
 return { ...changes, payload: { ...storedPayload, ...payloadPatch.data } };
}
