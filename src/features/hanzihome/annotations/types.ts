import { z } from "zod";
import { DbNoteSchema } from "@/types/database";

export const AnnotationAnchorSchema = z.object({
 lessonId: z.string(),
 nodeType: z.string(),
 nodeId: z.string(),
 startOffset: z.number(),
 endOffset: z.number(),
 selectedText: z.string(),
 prefixText: z.string(),
 suffixText: z.string(),
});
export const NullableAnnotationAnchorSchema = AnnotationAnchorSchema.nullable();

export type AnnotationAnchor = z.infer<typeof AnnotationAnchorSchema>;
export type NullableAnnotationAnchor = z.infer<typeof NullableAnnotationAnchorSchema>;

export const LessonTextAnnotationSchema = AnnotationAnchorSchema.extend({
 id: z.string(),
 tone: z.literal("focus"),
 noteId: z.string().nullable(),
 note: DbNoteSchema.nullable(),
 noteText: z.string(),
 createdAt: z.string(),
 updatedAt: z.string(),
});

export type LessonTextAnnotation = z.infer<typeof LessonTextAnnotationSchema>;

export const LessonAnnotationNoteUpdateSchema = z.strictObject({
 annotationId: z.uuid(),
 noteText: z.string().trim().min(1),
 expectedRevision: DbNoteSchema.shape.revision.nullable(),
});
export type LessonAnnotationNoteUpdate = z.infer<typeof LessonAnnotationNoteUpdateSchema>;

export const LessonAnnotationNoteResultSchema = z.strictObject({
 saved: z.boolean(),
 annotation: LessonTextAnnotationSchema,
});
export type LessonAnnotationNoteResult = z.infer<typeof LessonAnnotationNoteResultSchema>;

export const ResolvedLessonTextAnnotationSchema = LessonTextAnnotationSchema.extend({
 resolvedStartOffset: z.number(),
 resolvedEndOffset: z.number(),
 stale: z.boolean(),
});

export type ResolvedLessonTextAnnotation = z.infer<typeof ResolvedLessonTextAnnotationSchema>;
