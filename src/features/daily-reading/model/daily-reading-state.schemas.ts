import { z } from "zod";
import { JsonObjectSchema } from "@/types/json";
export const dailyReadingStateRowSchema = z.strictObject({
 user_id: z.uuid(),
 published_date: z.iso.date(),
 state: JsonObjectSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export type DailyReadingStateRow = z.output<typeof dailyReadingStateRowSchema>;
