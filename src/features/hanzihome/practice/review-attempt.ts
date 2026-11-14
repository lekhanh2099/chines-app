import { z } from "zod";

import { reviewResultSchema } from "@/features/hanzihome/schemas/learning-state.schema";

export const reviewAttemptItemTypeSchema = z.enum(["vocab", "grammar", "radical"]);

export const reviewAttemptAnswerSchema = z.strictObject({
 kind: z.literal("review"),
 itemType: reviewAttemptItemTypeSchema,
 result: reviewResultSchema,
 label: z.string().optional(),
 answeredAt: z.iso.datetime({ offset: true }).optional(),
 legacySource: z.literal("user_learning_state.review_history").optional(),
 legacyOrdinal: z.number().int().positive().optional(),
});

export type ReviewAttemptAnswer = z.output<typeof reviewAttemptAnswerSchema>;
