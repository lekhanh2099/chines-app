import { z } from "zod";
import { JsonObjectSchema } from "@/types/json";

const sourceSchema = z.enum(["seed", "custom"]);

const publicationStatusSchema = z.enum(["draft", "published", "archived"]);

export const readerKindSchema = z.enum([
 "core",
 "mock",
 "reinforcement",
 "hsk",
 "daily",
 "personal",
 "humanities",
]);

const readerAnalysisSchema = z.strictObject({
 mainIdeaVi: z.string(),
 paragraphStructureVi: z.array(z.string()),
 logicChainVi: z.array(z.string()),
 trapsVi: z.array(z.string()),
 keywordsZh: z.array(z.string()),
});

const readerSummarySchema = z.strictObject({
 modelZh: z.string(),
 rubricVi: z.array(z.string()),
});

export const readerDocumentRowSchema = z.strictObject({
 id: z.string().min(1),
 lesson_id: z.string().min(1),
 owner_id: z.uuid().nullable(),
 source: sourceSchema,
 publication_status: publicationStatusSchema,
 kind: readerKindSchema,
 slug: z.string().min(1),
 unit_id: z.string().nullable(),
 reading_number: z.number().int().positive().nullable(),
 title_zh: z.string().min(1),
 title_pinyin: z.string(),
 title_vi: z.string(),
 genre_vi: z.string(),
 objectives_vi: z.array(z.string()),
 analysis: readerAnalysisSchema,
 summary: readerSummarySchema,
 source_metadata: JsonObjectSchema,
 schema_version: z.string().min(1),
 imported_at: z.iso.datetime({ offset: true }).nullable(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
 deleted_at: z.iso.datetime({ offset: true }).nullable(),
});

export const readerParagraphRowSchema = z.strictObject({
 id: z.string().min(1),
 document_id: z.string().min(1),
 source: sourceSchema,
 paragraph_order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
 role_vi: z.string(),
 source_version: z.number().int().positive(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const readerVocabularyLinkRowSchema = z.strictObject({
 id: z.string().min(1),
 document_id: z.string().min(1),
 vocab_item_id: z.string().min(1),
 source: sourceSchema,
 item_order: z.number().int().positive(),
 meaning_in_context_vi: z.string(),
 source_ref: z.string(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const readerVocabularyRowSchema = z.strictObject({
 id: z.string().min(1),
 word: z.string().min(1),
 pinyin: z.string(),
 meaning: z.string(),
});

export type ReaderDocumentRow = z.output<typeof readerDocumentRowSchema>;

export type ReaderParagraphRow = z.output<typeof readerParagraphRowSchema>;

export type ReaderVocabularyLinkRow = z.output<typeof readerVocabularyLinkRowSchema>;
