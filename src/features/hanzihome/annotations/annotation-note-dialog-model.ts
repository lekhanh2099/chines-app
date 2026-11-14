import { parseErrorLike, type ErrorInput } from "@/types/error";
import { z } from "zod";

import { AnnotationAnchorSchema, LessonTextAnnotationSchema } from "./types";

export type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export const NoteDialogSchema = z.discriminatedUnion("kind", [
 z.object({ kind: z.literal("anchor"), anchor: AnnotationAnchorSchema }),
 z.object({ kind: z.literal("annotation"), annotation: LessonTextAnnotationSchema }),
]);

export type NoteDialogState = z.infer<typeof NoteDialogSchema>;

export function annotationErrorMessage(error: ErrorInput, fallback: string) {
 const candidate = parseErrorLike(error);
 if (candidate.code === "PGRST205" || candidate.code === "42883") {
  return "Database chưa có migration ghi chú. Hãy đồng bộ migration rồi thử lại.";
 }
 return candidate.message ? `${fallback}: ${candidate.message}` : fallback;
}
