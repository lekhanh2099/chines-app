import { z } from "zod";
import { JsonObjectSchema } from "@/types/json";
export const personalLearningStateRowSchema = z.strictObject({
 user_id: z.uuid(),
 node_id: z.string().min(1),
 state: JsonObjectSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export type PersonalLearningStateRow = z.output<typeof personalLearningStateRowSchema>;
