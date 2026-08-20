import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 deleteLessonAnnotation,
 updateLessonAnnotationNote,
} from "@/features/hanzihome/annotations/lesson-annotation-repository.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ annotationId: string }> };
const updateSchema = z.strictObject({ noteText: z.string().min(1) });

export async function PATCH(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const { annotationId } = await context.params;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = updateSchema.safeParse(body);
 if (!parsed.success || !z.uuid().safeParse(annotationId).success) {
  return apiError("Invalid lesson annotation payload", 400, "INVALID_PAYLOAD");
 }

 try {
  return privateNoStoreJson({
   annotation: await updateLessonAnnotationNote(
    createServiceRoleSupabaseClient(),
    auth.context.user.id,
    { annotationId, noteText: parsed.data.noteText },
   ),
  });
 } catch {
  return apiError("Could not update lesson annotation", 409, "ANNOTATION_CONFLICT");
 }
}

export async function DELETE(_request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
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
