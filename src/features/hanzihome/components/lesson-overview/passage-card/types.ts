import { z } from "zod";

export const PassageLineSchema = z.object({
 id: z.string(),
 zh: z.string(),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
});
export type PassageLine = z.infer<typeof PassageLineSchema>;

export const PassageClozeAnswerSchema = z.object({
 key: z.string(),
 label: z.string(),
 answer: z.string(),
 pinyin: z.string().optional(),
 note: z.string().optional(),
});
export type ClozeAnswer = z.infer<typeof PassageClozeAnswerSchema>;
