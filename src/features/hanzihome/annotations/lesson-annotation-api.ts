import { z } from "zod";

import {
 AnnotationAnchorSchema,
 LessonTextAnnotationSchema,
 type AnnotationAnchor,
 type LessonTextAnnotation,
 LessonAnnotationNoteUpdateSchema,
 LessonAnnotationNoteResultSchema,
 type LessonAnnotationNoteUpdate,
} from "./types";

const listResponseSchema = z.strictObject({ annotations: z.array(LessonTextAnnotationSchema) });
const annotationResponseSchema = z.strictObject({ annotation: LessonTextAnnotationSchema });
const deletedResponseSchema = z.strictObject({ deleted: z.boolean() });
const createPayloadSchema = z.strictObject({
 anchor: AnnotationAnchorSchema,
 noteText: z.string().min(1).optional(),
});

export class LessonAnnotationConflictError extends Error {
 constructor(readonly annotation: LessonTextAnnotation) {
  super("Ghi chú đã được thay đổi ở nơi khác.");
  this.name = "LessonAnnotationConflictError";
 }
}

export async function fetchLessonAnnotations(
 lessonId: string,
 ownerUserId: string,
): Promise<LessonTextAnnotation[]> {
 const response = await fetch(
  `/api/hanzihome/lesson-annotations?lessonId=${encodeURIComponent(lessonId)}`,
  { cache: "no-store", headers: { "X-HanziHome-Owner-Id": ownerUserId } },
 );
 const payload = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không tải được highlight bài học.");
 return listResponseSchema.parse(payload).annotations;
}

export async function createLessonAnnotation(
 input: {
  anchor: AnnotationAnchor;
  noteText?: string;
 },
 ownerUserId: string,
): Promise<LessonTextAnnotation> {
 const payload = createPayloadSchema.parse(input);
 const response = await fetch("/api/hanzihome/lesson-annotations", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerUserId },
  body: JSON.stringify(payload),
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không lưu được highlight bài học.");
 return annotationResponseSchema.parse(value).annotation;
}

export async function updateLessonAnnotationNote(
 input: LessonAnnotationNoteUpdate,
 ownerUserId: string,
): Promise<LessonTextAnnotation> {
 const payload = LessonAnnotationNoteUpdateSchema.parse(input);
 const response = await fetch(`/api/hanzihome/lesson-annotations/${payload.annotationId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerUserId },
  body: JSON.stringify({ noteText: payload.noteText, expectedRevision: payload.expectedRevision }),
 });
 const value = await response.json().catch(() => null);
 if (response.status === 409) {
  const conflict = LessonAnnotationNoteResultSchema.parse(value);
  if (!conflict.saved) throw new LessonAnnotationConflictError(conflict.annotation);
 }
 if (!response.ok) throw new Error("Không cập nhật được ghi chú bài học.");
 const result = LessonAnnotationNoteResultSchema.parse(value);
 if (!result.saved) throw new LessonAnnotationConflictError(result.annotation);
 const note = result.annotation.note;
 if (
  !note ||
  result.annotation.id !== payload.annotationId ||
  result.annotation.noteId !== note.id ||
  note.revision !== (payload.expectedRevision === null ? 0 : payload.expectedRevision + 1) ||
  result.annotation.noteText !== payload.noteText
 ) {
  throw new Error("Server chưa xác nhận đúng ghi chú vừa lưu.");
 }
 return result.annotation;
}

export async function deleteLessonAnnotation(
 annotationId: string,
 ownerUserId: string,
): Promise<boolean> {
 const response = await fetch(`/api/hanzihome/lesson-annotations/${annotationId}`, {
  method: "DELETE",
  headers: { "X-HanziHome-Owner-Id": ownerUserId },
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không xoá được highlight bài học.");
 return deletedResponseSchema.parse(value).deleted;
}
