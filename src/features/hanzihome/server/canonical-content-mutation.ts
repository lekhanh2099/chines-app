import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
 canonicalEntityTypeSchema,
 canonicalMutationOperationSchema,
 mutationEnvelopeSchema,
 mutationResponseSchema,
 getCanonicalChangesSchema,
 type CanonicalEntityType,
 type CanonicalMutationOperation,
} from "@/features/hanzihome/schemas/canonical-content.schema";
import { createClient } from "@/lib/supabase/server";
import { jsonValueSchema } from "@/lib/json-schema";

type MutationRpcError = {
 code?: string;
 message: string;
};

function statusForMutationError(error: MutationRpcError) {
 if (error.code === "40001") return 409;
 if (error.code === "28000") return 401;
 if (error.code === "42501") return 403;
 if (error.code === "P0002" || error.code === "23503") return 404;
 if (error.code === "22023" || error.code === "23505" || error.code === "23514") return 400;
 return 500;
}

export function mutationError(message: string, status: number, details?: unknown) {
 return NextResponse.json({ error: message, details }, { status });
}

export async function mutateCanonicalContent({
 request,
 entityType,
 operation,
 entityId,
 audit,
}: {
 request: Request;
 entityType: CanonicalEntityType;
 operation: CanonicalMutationOperation;
 entityId?: string;
 audit?: {
  operation?: CanonicalMutationOperation;
  entityType: string;
  entityId: string;
  parentEntityType?: string;
  parentEntityId?: string;
 };
}) {
 const parsedEntityType = canonicalEntityTypeSchema.parse(entityType);
 const parsedOperation = canonicalMutationOperationSchema.parse(operation);
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();

 if (!user) return mutationError("Unauthorized", 401);

 const body: unknown = await request.json().catch(() => null);
 const parsedBody = mutationEnvelopeSchema.safeParse(body);
 if (!parsedBody.success) {
  return mutationError("Invalid HanziHome mutation payload", 400, z.flattenError(parsedBody.error));
 }

 if (parsedOperation !== "create" && !parsedBody.data.expectedUpdatedAt) {
  return mutationError("expectedUpdatedAt is required", 400);
 }

 const parsedChanges = getCanonicalChangesSchema(parsedEntityType, parsedOperation).safeParse(
  parsedBody.data.changes,
 );
 if (!parsedChanges.success) {
  return mutationError("Invalid HanziHome changes", 400, z.flattenError(parsedChanges.error));
 }

 const { data, error } = await sessionClient.rpc("hanzihome_mutate_content_as_user", {
  p_operation: parsedOperation,
  p_entity_type: parsedEntityType,
  p_entity_id: entityId,
  p_expected_updated_at: parsedBody.data.expectedUpdatedAt,
  p_changes: jsonValueSchema.parse(parsedChanges.data),
  p_reason: parsedBody.data.reason,
  p_audit_operation: audit?.operation,
  p_audit_entity_type: audit?.entityType,
  p_audit_entity_id: audit?.entityId,
  p_audit_parent_entity_type: audit?.parentEntityType,
  p_audit_parent_entity_id: audit?.parentEntityId,
 });

 if (error) {
  return mutationError(error.message, statusForMutationError(error), error.code);
 }

 const parsedResponse = mutationResponseSchema.safeParse(data);
 if (!parsedResponse.success) {
  return mutationError(
   "Invalid HanziHome mutation response",
   500,
   z.flattenError(parsedResponse.error),
  );
 }

 return NextResponse.json(parsedResponse.data);
}
