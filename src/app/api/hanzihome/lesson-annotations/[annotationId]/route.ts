import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 deleteLessonAnnotation,
 updateLessonAnnotationNote,
} from "@/features/hanzihome/annotations/lesson-annotation-repository.server";
import {
 apiError,
 expectedAuthenticatedOwnerHeader,
 verifyExpectedAuthenticatedOwner,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { LessonAnnotationNoteUpdateSchema } from "@/features/hanzihome/annotations/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ annotationId: string }> };
const updateSchema = LessonAnnotationNoteUpdateSchema.omit({ annotationId: true });

export async function PATCH(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 if (request.headers.has(expectedAuthenticatedOwnerHeader)) {
  const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
  if (ownerError) return ownerError;
 }
 const { annotationId } = await context.params;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = updateSchema.safeParse(body);
 if (!parsed.success || !z.uuid().safeParse(annotationId).success) {
  return apiError("Invalid lesson annotation payload", 400, "INVALID_PAYLOAD");
 }

 try {
  const result = await updateLessonAnnotationNote(
   createServiceRoleSupabaseClient(),
   auth.context.user.id,
   { annotationId, ...parsed.data },
  );
  return privateNoStoreJson(result, { status: result.saved ? 200 : 409 });
 } catch {
  return apiError("Could not update lesson annotation", 409, "ANNOTATION_CONFLICT");
 }
}

export async function DELETE(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 if (request.headers.has(expectedAuthenticatedOwnerHeader)) {
  const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
  if (ownerError) return ownerError;
 }
 const { annotationId } = await context.params;
 if (!z.uuid().safeParse(annotationId).success) {
  return apiError("Invalid lesson annotation payload", 400, "INVALID_PAYLOAD");
 }

 try {
  return privateNoStoreJson({
   deleted: await deleteLessonAnnotation(
    createServiceRoleSupabaseClient(),
    auth.context.user.id,
    annotationId,
   ),
  });
 } catch {
  return apiError("Could not delete lesson annotation", 409, "ANNOTATION_CONFLICT");
 }
}
