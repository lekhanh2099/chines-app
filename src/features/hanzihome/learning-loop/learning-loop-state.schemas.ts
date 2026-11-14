import { z } from "zod";
import { learningLoopItemKindSchema } from "./learning-loop.schemas";
export const learningLoopItemRowSchema = z.strictObject({
 user_id: z.uuid(),
 id: z.string().min(1),
 stable_key: z.string().min(1),
 kind: learningLoopItemKindSchema,
 source_id: z.string().min(1),
 source_href: z.string().min(1),
 title_zh: z.string(),
 title_vi: z.string(),
 prompt_zh: z.string().min(1),
 pinyin: z.string(),
 meaning_vi: z.string(),
 user_answer: z.string(),
 error_key: z.string(),
 state: z.enum(["new", "learning", "stable"]),
 due_at: z.iso.datetime({ offset: true }),
 interval_days: z.number().int().nonnegative(),
 correct_streak: z.number().int().nonnegative(),
 lapse_count: z.number().int().nonnegative(),
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export type LearningLoopItemRow = z.output<typeof learningLoopItemRowSchema>;
