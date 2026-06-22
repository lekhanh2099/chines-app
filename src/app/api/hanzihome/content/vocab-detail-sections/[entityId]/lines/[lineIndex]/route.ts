import { z } from "zod";

import { mutationEnvelopeSchema } from "@/features/hanzihome/schemas/canonical-content.schema";
import {
 mutateCanonicalContent,
 mutationError,
} from "@/features/hanzihome/server/canonical-content-mutation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
 params: Promise<{ entityId: string; lineIndex: string }>;
};

const lineMutationSchema = mutationEnvelopeSchema.extend({
 value: z.string(),
});

export async function PATCH(request: Request, context: RouteContext) {
 const { entityId, lineIndex } = await context.params;
 const index = Number(lineIndex);
 if (!Number.isInteger(index) || index < 0) return mutationError("Invalid line index", 400);

 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();
 if (!user) return mutationError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsed = lineMutationSchema.safeParse(body);
 if (!parsed.success) {
  return mutationError("Invalid detail line mutation", 400, parsed.error.flatten());
 }
 if (!parsed.data.expectedUpdatedAt) return mutationError("expectedUpdatedAt is required", 400);

 const { data: detail, error } = await sessionClient
  .from("hanzihome_vocab_detail_sections")
  .select("id,lines,updated_at,deleted_at")
  .eq("id", entityId)
  .maybeSingle();
 if (error) return mutationError(error.message, 500, error.code);
 if (!detail || detail.deleted_at) return mutationError("Vocab detail section not found", 404);
 if (detail.updated_at !== parsed.data.expectedUpdatedAt) {
  return mutationError("HanziHome entity changed since it was loaded", 409);
 }
 if (index >= detail.lines.length) return mutationError("Detail line not found", 404);

 const lines = detail.lines.slice();
 lines[index] = parsed.data.value;
 const nextRequest = new Request(request.url, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
   reason: parsed.data.reason,
   expectedUpdatedAt: parsed.data.expectedUpdatedAt,
   changes: { lines },
  }),
 });

 return mutateCanonicalContent({
  request: nextRequest,
  entityType: "vocab_detail_section",
  operation: "update",
  entityId,
 });
}
