import { z } from "zod";

export const hskGrammarLevelSchema = z.enum(["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]);
export const hskGrammarExampleTierSchema = z.enum([
 "source",
 "basic",
 "natural",
 "advanced",
 "contrast",
]);

const hskGrammarExampleOriginSchema = z.enum([
 "source_normalized",
 "source_corrected",
 "editorial",
]);

const hskGrammarExampleSchema = z.object({
 zh: z.string(),
 pinyin: z.string(),
 vi: z.string(),
 note_vi: z.string(),
 origin: hskGrammarExampleOriginSchema,
});

const hskGrammarContrastSchema = z.object({
 with: z.string().nullable(),
 summary_vi: z.string(),
});

const hskGrammarCommonErrorSchema = z.object({
 wrong: z.string(),
 right: z.string(),
 explanation_vi: z.string(),
});

export const hskGrammarItemSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_point"),
 order: z.number().int().positive(),
 source_no: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string(),
 focus: z.array(z.string()),
 level: hskGrammarLevelSchema,
 categories: z.array(z.string()),
 core: z.string(),
 structures: z.array(z.string()),
 usage_notes: z.array(z.string()),
 constraints: z.array(z.string()),
 contrasts: z.array(hskGrammarContrastSchema),
 common_errors: z.array(hskGrammarCommonErrorSchema),
 examples: z.object({
  source: z.array(hskGrammarExampleSchema),
  basic: z.array(hskGrammarExampleSchema),
  natural: z.array(hskGrammarExampleSchema),
  advanced: z.array(hskGrammarExampleSchema),
  contrast: z.array(hskGrammarExampleSchema),
 }),
 source_ref: z.object({
  primary: z.string(),
  pdf_page: z.number().int().positive(),
  grammar_no: z.number().int().positive(),
 }),
 verification: z.object({
  status: z.string(),
  source_preserved: z.boolean(),
  source_examples_normalized: z.boolean(),
  notes: z.string(),
 }),
});

export const hskGrammarDatasetSchema = z
 .object({
  schema_version: z.literal("hsk_grammar_v1.0.0"),
  schema_contract: z.string(),
  dataset_id: z.string(),
  level: hskGrammarLevelSchema,
  language: z.literal("zh-CN"),
  ui_language: z.literal("vi-VN"),
  item_count: z.number().int().nonnegative(),
  level_basis: z.string(),
  primary_source: z.object({
   title: z.string(),
   file: z.string(),
   pages: z.number().int().positive(),
   coverage: z.string(),
  }),
  secondary_reference: z.array(
   z.object({
    title: z.string(),
    role: z.string(),
   }),
  ),
  editorial_policy: z.object({
   source_examples: z.string(),
   added_examples: z.string(),
   pinyin: z.string(),
   translation: z.string(),
  }),
  example_tiers: z.array(hskGrammarExampleTierSchema),
  items: z.array(hskGrammarItemSchema),
 })
 .refine((dataset) => dataset.item_count === dataset.items.length, {
  message: "HSK grammar item_count must match items.length",
 });

export type HskGrammarDataset = z.infer<typeof hskGrammarDatasetSchema>;
export type HskGrammarExampleTier = z.infer<typeof hskGrammarExampleTierSchema>;
export type HskGrammarItem = z.infer<typeof hskGrammarItemSchema>;
export type HskGrammarLevel = z.infer<typeof hskGrammarLevelSchema>;
