import * as z from "zod";

const learningStatusSchema = z.enum(["new", "learning", "known", "hard"]);
const reviewResultSchema = z.enum(["again", "hard", "known"]);
const hanziReaderFontSchema = z.union([
 z.enum(["system", "songti", "pinyin"]),
 z.enum(["kai", "mengshen"]).transform(() => "system" as const),
]);
const hanziReaderSizeSchema = z.enum(["md", "lg", "xl", "2xl", "3xl"]);
const moduleSchema = z.enum([
 "overview",
 "lessonText",
 "practice",
 "listening",
 "dictation",
 "script",
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
   lessonTextDisplayMode: z
    .object({
     showPinyin: z.boolean(),
     showMeaning: z.boolean(),
     showAnswers: z.boolean(),
     hanziFont: hanziReaderFontSchema,
     hanziSize: hanziReaderSizeSchema,
     revealMode: z.enum(["always", "tap"]).optional().default("always"),
    })
    .optional(),
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
