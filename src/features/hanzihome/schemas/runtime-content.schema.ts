import { z } from "zod";

import { DeepVocabularyItemSchema } from "@/features/hanzihome/schemas/vocab.schema";

/** Runtime rows may be incomplete; import readiness uses the stricter source schema. */
export const runtimeDeepVocabularyItemSchema = DeepVocabularyItemSchema.extend({
 pinyin: z.string(),
 meaning: DeepVocabularyItemSchema.shape.meaning.extend({
  meaning_vi: z.string(),
 }),
});
