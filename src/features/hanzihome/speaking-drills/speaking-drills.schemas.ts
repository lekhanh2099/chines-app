import { z } from "zod";

const speakingDrillTextSchema = z.object({
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
});

const speakingDrillLineSchema = speakingDrillTextSchema.extend({
 n: z.string().min(1),
 role: z.string().min(1),
});

const speakingDrillTopicSchema = z.object({
 id: z.string().min(1),
 no: z.number().int().positive(),
 titleVi: z.string().min(1),
 question: z.string().min(1),
 questionPinyin: z.string(),
 outline: z.string(),
 takeaways: z.object({
  points: z.array(z.string().min(1)),
  goldenQuote: z.string(),
 }),
 v1Lines: z.array(speakingDrillLineSchema).min(1),
 v2Lines: z.array(speakingDrillLineSchema).min(1),
 changes: z.array(z.object({ n: z.string().min(1), reason: z.string().min(1) })),
});

const speakingDrillLessonSchema = z.object({
 id: z.string().min(1),
 no: z.number().int().positive(),
 title: z.string().min(1),
 vocab: z.array(
  z.object({
   hanzi: z.string().min(1),
   pinyin: z.string(),
   vi: z.string().min(1),
  }),
 ),
 patterns: z.array(
  z.object({
   title: z.string().min(1),
   explanation: z.string(),
   examples: z.array(speakingDrillTextSchema),
  }),
 ),
 expressions: z.array(z.string().min(1)),
 notes: z.array(z.string().min(1)),
 topics: z.array(speakingDrillTopicSchema).min(1),
});

const speakingDrillBookSchema = z.object({
 id: z.string().min(1),
 name: z.string().min(1),
 title: z.string().min(1),
 subtitle: z.string().min(1),
 generalPrompt: z.string().min(1),
 lessons: z.array(speakingDrillLessonSchema).min(1),
});

export const speakingDrillsContentSchema = z.object({
 source: z.url(),
 books: z.array(speakingDrillBookSchema).min(1),
});

const speakingDrillVersionSchema = z.enum(["v2", "v1"]);
const speakingDrillsTabSchema = z.enum(["dialogue", "materials", "compare", "prompt"]);

export type SpeakingDrillVersion = z.output<typeof speakingDrillVersionSchema>;
export type SpeakingDrillsTab = z.output<typeof speakingDrillsTabSchema>;
export type SpeakingDrillBook = z.infer<typeof speakingDrillBookSchema>;
export type SpeakingDrillLesson = z.infer<typeof speakingDrillLessonSchema>;
export type SpeakingDrillTopic = z.infer<typeof speakingDrillTopicSchema>;
export type SpeakingDrillLine = z.infer<typeof speakingDrillLineSchema>;
