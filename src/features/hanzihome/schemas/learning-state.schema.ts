import * as z from "zod";
import {
 readerFontSchema,
 readerSizeSchema,
 readerRevealModeSchema,
} from "@/features/reader/model/reader-display";

export const learningStatusSchema = z.enum(["new", "learning", "known", "hard"]);
export const reviewResultSchema = z.enum(["again", "hard", "known"]);
export const hanziReaderFontSchema = z
 .enum([
  "system",
  "songti",
  "noto-sans",
  "pinyin",
  "kaiti",
  "fangsong",
  "ma-shan",
  "xiaowei",
  "kai",
  "mengshen",
 ])
 .transform((font) => (font === "kai" || font === "mengshen" ? "system" : font))
 .pipe(readerFontSchema);
export const hanziReaderSizeSchema = readerSizeSchema;
export const lessonTextRevealModeSchema = readerRevealModeSchema;
export const moduleSchema = z.enum([
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

export const progressItemSchema = z.object({
 level: z.number().int().min(0),
 status: learningStatusSchema,
 lastReviewedAt: z.string().optional(),
});

const lessonTextDisplayModeSchema = z.object({
 showPinyin: z.boolean(),
 autoDetectPinyin: z.boolean().optional().default(false),
 showMeaning: z.boolean(),
 showAnswers: z.boolean(),
 hanziFont: hanziReaderFontSchema,
 hanziSize: hanziReaderSizeSchema,
 revealMode: lessonTextRevealModeSchema.optional().default("always"),
});

export const userLearningStateSchema = z.object({
 settings: z
  .object({
   lastCourseId: z.string().optional(),
   lastLessonId: z.string().optional(),
   lastModule: moduleSchema.optional(),
   density: z.enum(["comfortable", "compact", "focus"]).optional(),
   vocabDetailTab: z.string().optional(),
   lessonTextDisplayMode: lessonTextDisplayModeSchema.optional(),
   bookDisplayModes: z.record(z.string(), lessonTextDisplayModeSchema).optional(),
   bookResume: z
    .record(
     z.string(),
     z.object({
      lessonId: z.string().min(1),
      module: z.string().min(1),
     }),
    )
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
    label: z.string().optional(),
    result: reviewResultSchema,
    answeredAt: z.string(),
   }),
  )
  .default([]),
});
