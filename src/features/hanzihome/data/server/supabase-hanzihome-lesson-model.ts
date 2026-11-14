import "server-only";

import { HanyuLessonSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import type {
 GrammarViewModel,
 HanziHomeEditableRecordMeta,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import type { GrammarRow, LessonDetailRow, LessonSummaryRow } from "./supabase-content-row.schemas";
import {
 countFromRelation,
 lessonSectionRowToSection,
 normalizeText,
} from "./supabase-hanzihome-content-utils";
import { vocabRowToViewModel } from "./supabase-hanzihome-vocab-model";

export function lessonSummaryToViewModel(row: LessonSummaryRow): HanziHomeLesson {
 const vocabCount = countFromRelation(row.vocab_count);
 const grammarCount = countFromRelation(row.grammar_count);

 return {
  id: row.id,
  lessonNumber: row.lesson_number,
  titleZh: row.title_zh,
  title: row.title_vi || row.title_zh,
  titlePinyin: row.title_pinyin ?? undefined,
  titleEn: row.title_en ?? undefined,
  tags: row.tags,
  sourceFile: row.source_file ?? undefined,
  courseId: row.course_id,
  courseTitle: row.course.title,
  bookId: row.book_id,
  bookTitle: row.book.title,
  bookOrder: row.book.book_order,
  lessonOrder: row.lesson_order,
  vocabCount,
  grammarCount,
  vocabIds: [],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
  editMeta: {
   entityType: "lesson",
   entityId: row.id,
   dbId: row.id,
   updatedAt: row.updated_at,
   order: row.lesson_order,
   orderField: "lesson_order",
  },
 };
}

function grammarRowToViewModel(row: GrammarRow): GrammarViewModel {
 return {
  id: `${row.lesson_id}__${row.id}`,
  title: row.title,
  titleVi: row.title_vi ?? undefined,
  level: row.level ?? undefined,
  tags: row.tags,
  contentMd: row.content_md ?? "",
  cleanTitle: row.clean_title || row.title,
  core: row.core,
  structuresView: row.structures_view,
  examplesParsed: row.examples
   .slice()
   .sort((left, right) => left.example_order - right.example_order)
   .map((example) => ({
    id: example.id,
    zh: example.zh,
    pinyin: normalizeText(example.pinyin),
    vi: normalizeText(example.vi),
    note: normalizeText(example.note),
   })),
  notes: row.notes,
  detailSections: row.details
   .slice()
   .sort((left, right) => left.section_order - right.section_order)
   .map((detail) => ({
    id: detail.id,
    key: detail.section_key,
    title: detail.title,
    lines: detail.lines,
   })),
  editMeta: {
   entityType: "grammar_point",
   entityId: `${row.lesson_id}__${row.id}`,
   dbId: row.id,
   updatedAt: row.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.lesson_id,
  },
 };
}

function editableRecordKey(entityType: string, entityId: string) {
 return `${entityType}:${entityId}`;
}

function buildEditableRecords(row: LessonDetailRow) {
 const records: Record<string, HanziHomeEditableRecordMeta> = {};
 const add = (record: HanziHomeEditableRecordMeta) => {
  records[editableRecordKey(record.entityType, record.entityId)] = record;
 };

 add({
  entityType: "lesson",
  entityId: row.id,
  dbId: row.id,
  updatedAt: row.updated_at,
  order: row.lesson_order,
  orderField: "lesson_order",
 });

 for (const section of row.sections) {
  add({
   entityType: "section",
   entityId: section.source_section_id,
   dbId: section.id,
   updatedAt: section.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.id,
   sectionDbId: section.id,
   order: section.section_order,
   orderField: "section_order",
  });
 }

 for (const item of row.vocab) {
  const runtimeId = `${row.id}__${item.id}`;
  add({
   entityType: "vocab_item",
   entityId: runtimeId,
   dbId: item.id,
   updatedAt: item.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.id,
   order: item.item_order,
   orderField: "item_order",
  });
  for (const example of item.examples) {
   add({
    entityType: "vocab_example",
    entityId: example.id,
    dbId: example.id,
    updatedAt: example.updated_at,
    parentEntityType: "vocab_item",
    parentEntityId: runtimeId,
    order: example.example_order,
    orderField: "example_order",
   });
  }
  for (const detail of item.details) {
   const detailRecord: HanziHomeEditableRecordMeta = {
    entityType: "vocab_detail_section",
    entityId: detail.id,
    dbId: detail.id,
    updatedAt: detail.updated_at,
    parentEntityType: "vocab_item",
    parentEntityId: runtimeId,
    order: detail.section_order,
    orderField: "section_order",
   };
   add(detailRecord);
   if (detail.section_key === "collocations") {
    detail.lines.forEach((_, lineIndex) => {
     add({
      ...detailRecord,
      entityId: `${item.id}:collocation:${lineIndex + 1}`,
      fieldPath: ["lines", lineIndex],
     });
    });
   }
  }
 }

 for (const point of row.grammar) {
  const runtimeId = `${row.id}__${point.id}`;
  add({
   entityType: "grammar_point",
   entityId: runtimeId,
   dbId: point.id,
   updatedAt: point.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.id,
   order: point.point_order,
   orderField: "point_order",
  });
  for (const example of point.examples) {
   add({
    entityType: "grammar_example",
    entityId: example.id,
    dbId: example.id,
    updatedAt: example.updated_at,
    parentEntityType: "grammar_point",
    parentEntityId: runtimeId,
    order: example.example_order,
    orderField: "example_order",
   });
  }
  for (const detail of point.details) {
   add({
    entityType: "grammar_detail_section",
    entityId: detail.id,
    dbId: detail.id,
    updatedAt: detail.updated_at,
    parentEntityType: "grammar_point",
    parentEntityId: runtimeId,
    order: detail.section_order,
    orderField: "section_order",
   });
  }
 }

 return records;
}

function buildSourceLesson(row: LessonDetailRow) {
 const sections = row.sections
  .filter((section) => section.section_type !== "listening")
  .slice()
  .sort((left, right) => left.section_order - right.section_order)
  .map((section) => lessonSectionRowToSection(section));

 if (sections.length === 0) {
  return undefined;
 }

 return HanyuLessonSchema.parse({
  lesson: {
   id: row.id,
   title: {
    zh: row.title_zh,
    pinyin: row.title_pinyin ?? "",
    vi: row.title_vi ?? "",
    en: row.title_en ?? "",
   },
   tags: row.tags,
   metadata: {
    legacy_id: "",
    book: row.book.title,
    volume: row.book.short_title || row.book.title,
    volume_vi: row.book.short_title || row.book.title,
    lesson_index: row.lesson_number,
    lesson_number_cn: "",
    lesson_title_cn: row.title_zh,
    lesson_title_pinyin: row.title_pinyin ?? "",
    lesson_title_vi: row.title_vi ?? "",
    lesson_title_en: row.title_en ?? "",
    source_files: [],
   },
   sections,
  },
 });
}

export function lessonDetailToViewModel(row: LessonDetailRow): HanziHomeLesson {
 const sortedVocab = row.vocab.slice().sort((left, right) => left.item_order - right.item_order);
 const sortedGrammar = row.grammar
  .slice()
  .sort((left, right) => left.point_order - right.point_order);
 const vocab = sortedVocab.map(vocabRowToViewModel);
 const grammar = sortedGrammar.map(grammarRowToViewModel);

 return {
  id: row.id,
  lessonNumber: row.lesson_number,
  titleZh: row.title_zh,
  title: row.title_vi || row.title_zh,
  titlePinyin: row.title_pinyin ?? undefined,
  titleEn: row.title_en ?? undefined,
  tags: row.tags,
  sourceFile: row.source_file ?? undefined,
  courseId: row.course_id,
  courseTitle: row.course.title,
  bookId: row.book_id,
  bookTitle: row.book.title,
  bookOrder: row.book.book_order,
  lessonOrder: row.lesson_order,
  vocabCategories: Array.from(new Set(vocab.map((item) => item.category))).map((nameVi) => ({
   nameVi,
   words: vocab.filter((item) => item.category === nameVi).map((item) => item.hanzi),
  })),
  vocabCount: vocab.length,
  grammarCount: grammar.length,
  vocabIds: vocab.map((item) => item.runtimeId),
  grammarPointIds: grammar.map((point) => point.id),
  vocab,
  grammar,
  notes: {
   overviewMarkdown: `# ${row.title_zh}\n\n${row.title_vi ?? ""}`,
   lessonTextMarkdown: row.texts
    .slice()
    .sort((left, right) => left.text_key.localeCompare(right.text_key, "en", { numeric: true }))
    .map((text) => text.content)
    .join("\n\n"),
   grammarSummary: grammar.map((point) => point.cleanTitle).join("\n"),
   vocabularyText: vocab.map((item) => `${item.hanzi} · ${item.pinyin}`).join("\n"),
  },
  sourceLesson: buildSourceLesson(row),
  editMeta: {
   entityType: "lesson",
   entityId: row.id,
   dbId: row.id,
   updatedAt: row.updated_at,
   order: row.lesson_order,
   orderField: "lesson_order",
  },
  editableRecords: buildEditableRecords(row),
 };
}
