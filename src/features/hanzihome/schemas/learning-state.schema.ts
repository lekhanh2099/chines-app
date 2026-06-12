import * as z from "zod";

const learningStatusSchema = z.enum(["new", "learning", "known", "hard"]);
const reviewResultSchema = z.enum(["again", "hard", "known"]);
const moduleSchema = z.enum([
 "overview",
 "lessonText",
 "notes",
 "vocab",
 "grammar",
 "radicals",
 "review",
]);

const progressItemSchema = z.object({
 level: z.number().int().min(0),
 status: learningStatusSchema,
 lastReviewedAt: z.string().optional(),
});

export const userLearningStateSchema = z.object({
 settings: z
  .object({
   lastCourseId: z.string().optional(),
   lastLessonId: z.string().optional(),
   lastModule: moduleSchema.optional(),
   density: z.enum(["comfortable", "compact", "focus"]).optional(),
   vocabDetailTab: z.string().optional(),
  })
  .default({}),
 progress: z
  .object({
   vocab: z.record(z.string(), progressItemSchema).optional(),
   grammar: z.record(z.string(), progressItemSchema).optional(),
  })
  .default({}),
 bookmarks: z
  .object({
   lessons: z.array(z.string()).optional(),
   vocab: z.array(z.string()).optional(),
   grammar: z.array(z.string()).optional(),
   radicals: z.array(z.string()).optional(),
  })
  .default({}),
 reviewHistory: z
  .array(
   z.object({
    type: z.enum(["vocab", "grammar", "radical"]),
    id: z.string(),
    result: reviewResultSchema,
    answeredAt: z.string(),
   }),
  )
  .default([]),
});

export type UserLearningStatePayload = z.infer<typeof userLearningStateSchema>;
