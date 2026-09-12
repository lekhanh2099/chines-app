import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 deleteReaderAnnotation,
 updateReaderAnnotation,
} from "@/features/reading/repositories/reading-annotation.repository";
import { JsonObjectSchema } from "@/types/json";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ annotationId: string }> };
const updateSchema = z.strictObject({
 paragraphId: z.string().min(1).nullable(),
 assetId: z.string().min(1).nullable(),
 color: z.enum(["yellow", "green", "blue", "pink"]),
 pageNumber: z.number().int().positive().nullable(),
 startOffset: z.number().int().nonnegative().nullable(),
 endOffset: z.number().int().positive().nullable(),
 selectedText: z.string(),
 noteText: z.string(),
 payload: JsonObjectSchema,
 expectedRevision: z.number().int().nonnegative(),
});
const deleteSchema = z.strictObject({ expectedRevision: z.number().int().nonnegative() });

export async function PATCH(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;
 const { annotationId } = await context.params;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = updateSchema.safeParse(body);
 if (!parsed.success || !annotationId)
  return apiError("Invalid annotation payload", 400, "INVALID_PAYLOAD");
 try {
  return privateNoStoreJson({
   annotation: await updateReaderAnnotation({ annotationId, ...parsed.data }, auth.context),
  });
 } catch {
  return apiError("Could not update Reader annotation", 409, "ANNOTATION_CONFLICT");
 }
}

export async function DELETE(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;
 const { annotationId } = await context.params;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = deleteSchema.safeParse(body);
 if (!parsed.success || !annotationId)
  return apiError("Invalid annotation payload", 400, "INVALID_PAYLOAD");
 try {
  return privateNoStoreJson({
   deleted: await deleteReaderAnnotation({ annotationId, ...parsed.data }, auth.context),
  });
 } catch {
  return apiError("Could not delete Reader annotation", 409, "ANNOTATION_CONFLICT");
 }
}
