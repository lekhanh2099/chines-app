import { z } from "zod";

import { mutationError } from "@/features/hanzihome/server/canonical-content-mutation";
import { privateNoStoreJson } from "@/lib/api/authenticated-route";
import { createClient } from "@/lib/supabase/server";

const purgeRequestSchema = z.object({
 entityType: z.enum(["course", "book", "lesson"]),
 entityId: z.string().trim().min(1),
 expectedUpdatedAt: z.iso.datetime({ offset: true }),
 reason: z.string().trim().min(1),
});

const purgeResponseSchema = z.object({
 purged: z.object({
  entityType: z.enum(["course", "book", "lesson"]),
  entityId: z.string(),
 }),
});

function statusForPurgeError(code?: string) {
 if (code === "40001") return 409;
 if (code === "28000") return 401;
 if (code === "42501") return 403;
 if (code === "P0002" || code === "23503") return 404;
 if (code === "22023") return 400;
 return 500;
}

export async function POST(request: Request) {
 const client = await createClient();
 const {
  data: { user },
 } = await client.auth.getUser();
 if (!user) return mutationError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsedBody = purgeRequestSchema.safeParse(body);
 if (!parsedBody.success) {
  return mutationError("Invalid HanziHome purge payload", 400, z.flattenError(parsedBody.error));
 }

 const { data, error } = await client.rpc("hanzihome_purge_deleted_content_as_user", {
  p_entity_type: parsedBody.data.entityType,
  p_entity_id: parsedBody.data.entityId,
  p_expected_updated_at: parsedBody.data.expectedUpdatedAt,
  p_reason: parsedBody.data.reason,
 });

 if (error) return mutationError(error.message, statusForPurgeError(error.code), error.code);

 const parsedResponse = purgeResponseSchema.safeParse(data);
 if (!parsedResponse.success) {
  return mutationError(
   "Invalid HanziHome purge response",
   500,
   z.flattenError(parsedResponse.error),
  );
 }

 return privateNoStoreJson(parsedResponse.data);
}
