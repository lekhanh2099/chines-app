import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 createLessonAnnotation,
 listLessonAnnotations,
} from "@/features/hanzihome/annotations/lesson-annotation-repository.server";
import { AnnotationAnchorSchema } from "@/features/hanzihome/annotations/types";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ lessonId: z.string().min(1) });
const createSchema = z.strictObject({
 anchor: AnnotationAnchorSchema,
 noteText: z.string().min(1).optional(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const parsed = querySchema.safeParse({
  lessonId: new URL(request.url).searchParams.get("lessonId"),
 });
 if (!parsed.success) return apiError("Invalid lesson annotation query", 400, "INVALID_QUERY");

 try {
  return privateNoStoreJson({
   annotations: await listLessonAnnotations(
    createServiceRoleSupabaseClient(),
    auth.context.user.id,
    parsed.data.lessonId,
   ),
  });
 } catch {
  return apiError("Could not load lesson annotations", 503, "ANNOTATIONS_UNAVAILABLE");
 }
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = createSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid lesson annotation payload", 400, "INVALID_PAYLOAD");

 try {
  return privateNoStoreJson({
   annotation: await createLessonAnnotation(
    createServiceRoleSupabaseClient(),
    auth.context.user.id,
    parsed.data,
   ),
  });
 } catch {
  return apiError("Could not save lesson annotation", 503, "ANNOTATION_SAVE_UNAVAILABLE");
 }
}
