import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { z } from "zod";

import { VocabularySectionSchema } from "../src/features/hanzihome/schemas/hanyu-lesson.schema.ts";
import { vocabCoreRowSchema } from "../src/features/hanzihome/data/server/supabase-content-row.schemas.ts";
import { PartOfSpeechSchema } from "../src/features/hanzihome/schemas/vocab.schema.ts";
import { createHanziHomeAdminClient } from "./lib/hanzihome-supabase-seed.ts";

const vocabularySectionRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 payload: VocabularySectionSchema,
});

const vocabularyAuditRowSchema = vocabCoreRowSchema.pick({
 id: true,
 lesson_id: true,
 item_order: true,
 word: true,
 pinyin: true,
 meaning: true,
 pos_vi: true,
 tags: true,
});

export type VocabularyDuplicationSection = z.infer<typeof vocabularySectionRowSchema>;
export type VocabularyDuplicationItem = z.infer<typeof vocabularyAuditRowSchema>;

export type VocabularyLessonDuplicationAudit = {
 lessonId: string;
 sectionId: string;
 sectionItemCount: number;
 normalizedItemCount: number;
 duplicateBytes: number;
 exact: boolean;
 countOrIdMismatch: boolean;
 missingNormalizedItemIds: string[];
 extraNormalizedItemIds: string[];
 fieldMismatchItemIds: string[];
};

export type VocabularyDuplicationAuditReport = {
 lessons: VocabularyLessonDuplicationAudit[];
 exactLessonCount: number;
 countOrIdMismatchLessonCount: number;
 fieldMismatchLessonCount: number;
 removableBytes: number;
};

function normalizedPos(value: z.infer<z.ZodNullable<z.ZodString>>) {
 const normalized = value?.trim().toLowerCase().replaceAll(" ", "_") ?? "unknown";
 const parsed = PartOfSpeechSchema.safeParse(normalized);
 return parsed.success ? parsed.data : "unknown";
}

function sortedTags(tags: string[]) {
 return tags.slice().sort((left, right) => left.localeCompare(right));
}

function itemFieldsMatch(
 sectionItem: VocabularyDuplicationSection["payload"]["items"][number],
 normalizedItem: VocabularyDuplicationItem,
) {
 return (
  sectionItem.order === normalizedItem.item_order &&
  sectionItem.hanzi === normalizedItem.word &&
  sectionItem.pinyin === normalizedItem.pinyin &&
  sectionItem.meaning_vi === normalizedItem.meaning &&
  sectionItem.pos === normalizedPos(normalizedItem.pos_vi) &&
  isDeepStrictEqual(sortedTags(sectionItem.tags), sortedTags(normalizedItem.tags))
 );
}

export function auditVocabularyDuplication(
 sections: VocabularyDuplicationSection[],
 vocabularyItems: VocabularyDuplicationItem[],
): VocabularyDuplicationAuditReport {
 const vocabularyByLesson = new Map<string, VocabularyDuplicationItem[]>();

 for (const item of vocabularyItems) {
  const lessonItems = vocabularyByLesson.get(item.lesson_id);
  if (lessonItems) lessonItems.push(item);
  else vocabularyByLesson.set(item.lesson_id, [item]);
 }

 const lessons = sections.map((section) => {
  const normalizedItems = vocabularyByLesson.get(section.lesson_id) ?? [];
  const normalizedById = new Map(normalizedItems.map((item) => [item.id, item]));
  const sectionIds = section.payload.items.map((item) => item.id).sort();
  const normalizedIds = normalizedItems.map((item) => item.id).sort();
  const countOrIdMismatch = !isDeepStrictEqual(sectionIds, normalizedIds);
  const sectionIdSet = new Set(sectionIds);
  const normalizedIdSet = new Set(normalizedIds);
  const missingNormalizedItemIds = sectionIds.filter((id) => !normalizedIdSet.has(id));
  const extraNormalizedItemIds = normalizedIds.filter((id) => !sectionIdSet.has(id));
  const fieldMismatchItemIds = section.payload.items.flatMap((item) => {
   const normalizedItem = normalizedById.get(item.id);
   return normalizedItem && itemFieldsMatch(item, normalizedItem) ? [] : [item.id];
  });
  const exact = !countOrIdMismatch && fieldMismatchItemIds.length === 0;

  return {
   lessonId: section.lesson_id,
   sectionId: section.id,
   sectionItemCount: section.payload.items.length,
   normalizedItemCount: normalizedItems.length,
   duplicateBytes: Buffer.byteLength(JSON.stringify(section.payload.items)),
   exact,
   countOrIdMismatch,
   missingNormalizedItemIds,
   extraNormalizedItemIds,
   fieldMismatchItemIds,
  };
 });

 return {
  lessons,
  exactLessonCount: lessons.filter((lesson) => lesson.exact).length,
  countOrIdMismatchLessonCount: lessons.filter((lesson) => lesson.countOrIdMismatch).length,
  fieldMismatchLessonCount: lessons.filter(
   (lesson) => !lesson.countOrIdMismatch && lesson.fieldMismatchItemIds.length > 0,
  ).length,
  removableBytes: lessons
   .filter((lesson) => lesson.exact)
   .reduce((total, lesson) => total + lesson.duplicateBytes, 0),
 };
}

async function main() {
 const client = createHanziHomeAdminClient();
 const sections: VocabularyDuplicationSection[] = [];
 const vocabularyItems: VocabularyDuplicationItem[] = [];
 const pageSize = 1000;

 for (let from = 0; ; from += pageSize) {
  const result = await client
   .from("hanzihome_lesson_sections")
   .select("id,lesson_id,payload")
   .eq("section_type", "vocabulary")
   .is("deleted_at", null)
   .order("id")
   .range(from, from + pageSize - 1);
  if (result.error) {
   throw new Error(`Could not read vocabulary sections: ${result.error.message}`);
  }
  const page = z.array(vocabularySectionRowSchema).parse(result.data);
  sections.push(...page.filter((section) => section.payload.items.length > 0));
  if (page.length < pageSize) break;
 }

 for (let from = 0; ; from += pageSize) {
  const result = await client
   .from("hanzihome_vocab_items")
   .select("id,lesson_id,item_order,word,pinyin,meaning,pos_vi,tags")
   .is("deleted_at", null)
   .order("id")
   .range(from, from + pageSize - 1);
  if (result.error) {
   throw new Error(`Could not read normalized vocabulary: ${result.error.message}`);
  }
  const page = z.array(vocabularyAuditRowSchema).parse(result.data);
  vocabularyItems.push(...page);
  if (page.length < pageSize) break;
 }

 const report = auditVocabularyDuplication(sections, vocabularyItems);

 console.log(JSON.stringify(report, null, 2));
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
 main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
 });
}
