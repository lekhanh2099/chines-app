import { z } from "zod";

import {
 AnnotationAnchorSchema,
 LessonTextAnnotationSchema,
 type AnnotationAnchor,
 type LessonTextAnnotation,
} from "./types";

const listResponseSchema = z.strictObject({ annotations: z.array(LessonTextAnnotationSchema) });
const annotationResponseSchema = z.strictObject({ annotation: LessonTextAnnotationSchema });
const deletedResponseSchema = z.strictObject({ deleted: z.boolean() });
const createPayloadSchema = z.strictObject({
 anchor: AnnotationAnchorSchema,
 noteText: z.string().min(1).optional(),
});
const updatePayloadSchema = z.strictObject({ annotationId: z.uuid(), noteText: z.string().min(1) });

export async function fetchLessonAnnotations(lessonId: string): Promise<LessonTextAnnotation[]> {
 const response = await fetch(
  `/api/hanzihome/lesson-annotations?lessonId=${encodeURIComponent(lessonId)}`,
  { cache: "no-store" },
 );
 const payload = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không tải được highlight bài học.");
 return listResponseSchema.parse(payload).annotations;
}

export async function createLessonAnnotation(input: {
 anchor: AnnotationAnchor;
 noteText?: string;
}): Promise<LessonTextAnnotation> {
 const payload = createPayloadSchema.parse(input);
 const response = await fetch("/api/hanzihome/lesson-annotations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không lưu được highlight bài học.");
 return annotationResponseSchema.parse(value).annotation;
}

export async function updateLessonAnnotationNote(input: {
 annotationId: string;
 noteText: string;
}): Promise<LessonTextAnnotation> {
 const payload = updatePayloadSchema.parse(input);
 const response = await fetch(`/api/hanzihome/lesson-annotations/${payload.annotationId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ noteText: payload.noteText }),
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không cập nhật được ghi chú bài học.");
 return annotationResponseSchema.parse(value).annotation;
}

export async function deleteLessonAnnotation(annotationId: string): Promise<boolean> {
 const response = await fetch(`/api/hanzihome/lesson-annotations/${annotationId}`, {
  method: "DELETE",
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không xoá được highlight bài học.");
 return deletedResponseSchema.parse(value).deleted;
}
