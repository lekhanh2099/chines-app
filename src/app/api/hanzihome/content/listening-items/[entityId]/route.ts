import {
 mutationEnvelopeSchema,
 mutationResponseSchema,
} from "@/features/hanzihome/schemas/canonical-content.schema";
import { updateListeningItemChangesSchema } from "@/features/hanzihome/listening/listening.schemas";
import { mutationError } from "@/features/hanzihome/server/canonical-content-mutation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
 params: Promise<{ entityId: string }>;
};

function statusForMutationError(code: string | undefined) {
 if (code === "40001") return 409;
 if (code === "28000") return 401;
 if (code === "42501") return 403;
 if (code === "P0002") return 404;
 if (code === "22023" || code === "23514") return 400;
 return 500;
}

export async function PATCH(request: Request, context: RouteContext) {
 const { entityId } = await context.params;
 const body: unknown = await request.json().catch(() => null);
 const envelope = mutationEnvelopeSchema.safeParse(body);

 if (!envelope.success) {
  return mutationError("Invalid listening item mutation payload", 400, envelope.error.flatten());
 }
 if (!envelope.data.expectedUpdatedAt) {
  return mutationError("expectedUpdatedAt is required", 400);
 }

 const changes = updateListeningItemChangesSchema.safeParse(envelope.data.changes);
 if (!changes.success) {
  return mutationError("Invalid listening item changes", 400, changes.error.flatten());
 }

 const supabase = await createClient();
 const { data, error } = await supabase.rpc("hanzihome_update_listening_item_as_user", {
  p_entity_id: entityId,
  p_expected_updated_at: envelope.data.expectedUpdatedAt,
  p_changes: changes.data,
  p_reason: envelope.data.reason,
 });

 if (error) {
  return mutationError(error.message, statusForMutationError(error.code), error.code);
 }

 const response = mutationResponseSchema.safeParse(data);
 if (!response.success) {
  return mutationError("Invalid listening item mutation response", 500, response.error.flatten());
 }

 return Response.json(response.data);
}
