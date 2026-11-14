import { z } from "zod";

import { mutationError } from "@/features/hanzihome/server/canonical-content-mutation";
import { privateNoStoreJson } from "@/lib/api/authenticated-route";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
 action: z.enum(["list", "preview", "mutate"]),
 entityType: z.enum(["vocab_detail_section", "vocab_example"]),
 scopeType: z.enum(["lesson", "book", "course"]),
 scopeId: z.string().trim().min(1),
 deleted: z.boolean().default(false),
 sectionKeys: z.array(z.string().trim().min(1)).optional(),
 ids: z.array(z.string().trim().min(1)).optional(),
 query: z.string().trim().max(200).optional(),
 operation: z.enum(["soft_delete", "restore", "purge"]).optional(),
 expectedCount: z.number().int().nonnegative().optional(),
 expectedFingerprint: z.string().optional(),
 reason: z.string().trim().min(3).max(500).optional(),
 page: z.number().int().positive().default(1),
 pageSize: z.number().int().min(1).max(100).default(25),
});

export async function POST(request: Request) {
 const client = await createClient();
 const { data: authData } = await client.auth.getUser();
 if (!authData.user) return mutationError("Unauthorized", 401);

 const parsed = requestSchema.safeParse(await request.json().catch(() => null));
 if (!parsed.success) return mutationError("Invalid vocabulary bulk request", 400);
 const input = parsed.data;

 if (input.action === "list") {
  const { data, error } = await client.rpc("hanzihome_list_vocab_children", {
   p_entity_type: input.entityType,
   p_scope_type: input.scopeType,
   p_scope_id: input.scopeId,
   p_deleted: input.deleted,
   p_section_keys: input.sectionKeys,
   p_query: input.query,
   p_page: input.page,
   p_page_size: input.pageSize,
  });
  if (error) return mutationError(error.message, error.code === "42501" ? 403 : 400);
  return privateNoStoreJson({ list: data });
 }

 if (input.action === "preview") {
  const { data, error } = await client.rpc("hanzihome_preview_vocab_child_bulk", {
   p_entity_type: input.entityType,
   p_scope_type: input.scopeType,
   p_scope_id: input.scopeId,
   p_deleted: input.deleted,
   p_section_keys: input.sectionKeys,
   p_ids: input.ids,
   p_query: input.query,
  });
  if (error) return mutationError(error.message, error.code === "42501" ? 403 : 409);
  return privateNoStoreJson({ preview: data });
 }

 if (
  !input.operation ||
  input.expectedCount === undefined ||
  !input.expectedFingerprint ||
  !input.reason
 ) {
  return mutationError("Mutation requires preview fingerprint, count and reason", 400);
 }
 const { data, error } = await client.rpc("hanzihome_mutate_vocab_child_bulk", {
  p_entity_type: input.entityType,
  p_scope_type: input.scopeType,
  p_scope_id: input.scopeId,
  p_operation: input.operation,
  p_expected_count: input.expectedCount,
  p_expected_fingerprint: input.expectedFingerprint,
  p_reason: input.reason,
  p_section_keys: input.sectionKeys,
  p_ids: input.ids,
  p_query: input.query,
 });
 if (error) {
  const status = error.code === "42501" ? 403 : error.code === "40001" ? 409 : 400;
  return mutationError(error.message, status);
 }
 return privateNoStoreJson({ result: data });
}
