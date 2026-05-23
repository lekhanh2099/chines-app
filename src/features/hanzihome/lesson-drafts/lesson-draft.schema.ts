import { z } from "zod";

export const lessonDraftStatusSchema = z.enum([
 "draft",
 "published",
 "archived",
]);

export const lessonDraftContentSchema = z
 .object({
  lesson: z.object({
   id: z.string().min(1),
   lessonNumber: z.number().int().positive().optional(),
   titleZh: z.string().min(1),
   titleVi: z.string().optional(),
   vocabIds: z.array(z.string()).default([]),
   grammarPointIds: z.array(z.string()).default([]),
  }),
  vocab: z.array(z.unknown()),
  grammarPoints: z.array(z.record(z.unknown())).default([]),
  flashcards: z.array(z.record(z.unknown())).default([]),
 })
 .passthrough();

export const createLessonDraftRequestSchema = z.object({
 lessonNumber: z.number().int().positive(),
 titleZh: z.string().trim().min(1, "Vui lòng nhập tên bài tiếng Trung"),
 titleVi: z.string().trim().optional(),
 lessonKey: z.string().trim().min(1).optional(),
});

export const updateLessonDraftRequestSchema = z.object({
 lessonNumber: z.number().int().positive().optional(),
 titleZh: z.string().trim().min(1).optional(),
 titleVi: z.string().trim().optional(),
 lessonKey: z.string().trim().min(1).optional(),
 status: lessonDraftStatusSchema.optional(),
 content: lessonDraftContentSchema.optional(),
});

export const lessonDraftRowSchema = z.object({
 id: z.string(),
 user_id: z.string(),
 lesson_key: z.string(),
 status: lessonDraftStatusSchema,
 title_zh: z.string(),
 title_vi: z.string().nullable(),
 lesson_number: z.number().nullable(),
 content: lessonDraftContentSchema,
 created_at: z.string(),
 updated_at: z.string(),
});

export type LessonDraftStatus = z.infer<typeof lessonDraftStatusSchema>;
export type LessonDraftContent = z.infer<typeof lessonDraftContentSchema>;
export type CreateLessonDraftRequest = z.infer<
 typeof createLessonDraftRequestSchema
>;
export type UpdateLessonDraftRequest = z.infer<
 typeof updateLessonDraftRequestSchema
>;

export type LessonDraft = {
 id: string;
 userId: string;
 lessonKey: string;
 status: LessonDraftStatus;
 titleZh: string;
 titleVi?: string;
 lessonNumber?: number;
 content: LessonDraftContent;
 createdAt: string;
 updatedAt: string;
};

export function createLessonKey(lessonNumber: number) {
 return `custom-bai-${lessonNumber}`;
}

export function buildEmptyLessonDraftContent(
 input: CreateLessonDraftRequest & { lessonKey: string },
): LessonDraftContent {
 return {
  lesson: {
   id: input.lessonKey,
   lessonNumber: input.lessonNumber,
   titleZh: input.titleZh,
   titleVi: input.titleVi,
   vocabIds: [],
   grammarPointIds: [],
  },
  vocab: [],
  grammarPoints: [],
  flashcards: [],
 };
}

export function toLessonDraft(row: unknown): LessonDraft {
 const parsed = lessonDraftRowSchema.parse(row);

 return {
  id: parsed.id,
  userId: parsed.user_id,
  lessonKey: parsed.lesson_key,
  status: parsed.status,
  titleZh: parsed.title_zh,
  titleVi: parsed.title_vi ?? undefined,
  lessonNumber: parsed.lesson_number ?? undefined,
  content: parsed.content,
  createdAt: parsed.created_at,
  updatedAt: parsed.updated_at,
 };
}

export function isPostgresUniqueViolation(error: { code?: string } | null) {
 return error?.code === "23505";
}
