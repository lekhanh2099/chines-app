import "server-only";

import { getRadicalsFromDatabase } from "./supabase-hanzihome-content-queries";
import { getAggregateItems, getAggregateVocabRevision } from "./supabase-hanzihome-vocabulary";

/**
 * The database content that remains: radicals and the vocabulary store rows.
 * Lesson content is static JSON (`static-json/`).
 */
export const supabaseHanziHomeContentRepository = {
 getRadicals: getRadicalsFromDatabase,
 getAggregateItems,
 getAggregateVocabRevision,
};
