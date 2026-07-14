import { z } from "zod";

import type { Json } from "@/types/supabase.generated";

export const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
 z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(jsonValueSchema),
  z.record(z.string(), jsonValueSchema),
 ]),
);
