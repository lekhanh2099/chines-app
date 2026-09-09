import { z } from "zod";

export const readerAnswerStateSchema = z.strictObject({
 answer: z.string(),
 score: z.number().min(0).max(1).nullable(),
 completed: z.boolean(),
 responseMs: z.number().int().nonnegative().nullable(),
});
export const readerAnswersSchema = z.record(z.string().min(1), readerAnswerStateSchema);
export type ReaderAnswerState = z.output<typeof readerAnswerStateSchema>;

export const readerProgressRowSchema = z.object({
 user_id: z.uuid(),
 document_id: z.string().min(1),
 completed: z.boolean(),
 answers: readerAnswersSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});
export type ReaderProgressRow = z.output<typeof readerProgressRowSchema>;

export const readerFeatureStateSchema = z.object({
 completed: z.boolean(),
 answers: readerAnswersSchema,
});
