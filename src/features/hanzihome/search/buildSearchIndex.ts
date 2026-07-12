import type {
 HanziHomeData,
 HanziHomeLesson,
 HanziHomeModule,
 StaticRadicalData,
} from "@/features/hanzihome/types";

import { normalizeSearchText } from "./normalize";
import type { HanziHomeSearchIndexItem, HanziHomeSearchKind } from "./types";

type UnknownRecord = Record<string, unknown>;
const MAX_SEARCH_TEXT_LENGTH = 1_500;

function asRecord(value: unknown): UnknownRecord {
 return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function text(record: UnknownRecord, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function stringsFromValue(value: unknown, depth = 0): string[] {
 if (depth > 5) return [];
 if (typeof value === "string") return value.trim() ? [value.trim()] : [];
 if (typeof value === "number") return [String(value)];
 if (Array.isArray(value)) return value.flatMap((item) => stringsFromValue(item, depth + 1));
 if (!value || typeof value !== "object") return [];

 return Object.entries(value as UnknownRecord).flatMap(([key, child]) =>
  key === "id" || key.endsWith("_refs") || key === "source_refs"
   ? []
   : stringsFromValue(child, depth + 1),
 );
}

function compactSearchText(...values: Array<string | null | undefined>) {
 const segments = new Set<string>();

 values.forEach((value) => {
  if (!value) return;
  value
   .split(/\s*[·\n]\s*/u)
   .map((segment) => segment.trim())
   .filter(Boolean)
   .forEach((segment) => segments.add(segment));
 });

 return normalizeSearchText([...segments].join(" ")).slice(0, MAX_SEARCH_TEXT_LENGTH);
}

function lessonHref(lesson: HanziHomeLesson, module: HanziHomeModule) {
 const params = new URLSearchParams({
  courseId: lesson.courseId ?? "",
  lesson: String(lesson.lessonNumber),
  module,
 });
 return `/hanzihome?${params.toString()}`;
}

function lessonContext(lesson: HanziHomeLesson, label: string) {
 return [lesson.courseTitle, `Bài ${lesson.lessonNumber}`, label].filter(Boolean).join(" · ");
}

function createItem(params: {
 id: string;
 kind: HanziHomeSearchKind;
 title: string;
 subtitle?: string;
 body?: string;
 lesson?: HanziHomeLesson;
 module?: HanziHomeModule;
 targetId?: string;
 href?: string;
 metadata?: HanziHomeSearchIndexItem["metadata"];
}) {
 const { lesson } = params;
 const item: HanziHomeSearchIndexItem = {
  id: params.id,
  kind: params.kind,
  title: params.title,
  subtitle: params.subtitle,
  searchText: compactSearchText(params.title, params.subtitle, params.body),
  courseId: lesson?.courseId,
  courseTitle: lesson?.courseTitle,
  bookId: lesson?.bookId,
  lessonId: lesson?.id,
  lessonNumber: lesson?.lessonNumber,
  module: params.module,
  targetId: params.targetId,
  href: params.href ?? (lesson && params.module ? lessonHref(lesson, params.module) : undefined),
  metadata: params.metadata,
 };

 return item;
}

function buildVocabItems(lesson: HanziHomeLesson) {
 return lesson.vocab.map((vocab) => {
  const record = asRecord(vocab);
  const meaning = asRecord(record.meaning);
  const pos = asRecord(record.pos);
  const body = [
   text(record, "pinyin"),
   text(meaning, "hanviet"),
   text(meaning, "meaning_vi"),
   text(meaning, "short_definition_vi"),
   stringsFromValue(meaning.natural_translations_vi).join(" "),
   text(record, "category"),
   text(pos, "raw_vi"),
   stringsFromValue(record.examples).join(" "),
   stringsFromValue(record.collocations).join(" "),
  ]
   .filter(Boolean)
   .join(" · ");

  return createItem({
   id: `vocab:${vocab.runtimeId}`,
   kind: "vocab",
   title: vocab.hanzi,
   subtitle: lessonContext(lesson, `Từ vựng · ${vocab.pinyin}`),
   body,
   lesson,
   module: "vocab",
   targetId: vocab.runtimeId,
  });
 });
}

function buildGrammarItems(lesson: HanziHomeLesson) {
 return lesson.grammar.map((grammar) =>
  createItem({
   id: `grammar:${grammar.id}`,
   kind: "grammar",
   title: grammar.cleanTitle,
   subtitle: lessonContext(lesson, "Ngữ pháp"),
   body: [
    grammar.core,
    grammar.structuresView.join(" "),
    grammar.examplesParsed
     .map((example) => [example.zh, example.pinyin, example.vi].filter(Boolean).join(" "))
     .join(" "),
    grammar.detailSections
     ?.map((section) => `${section.title} ${section.lines.join(" ")}`)
     .join(" "),
   ]
    .filter(Boolean)
    .join(" · "),
   lesson,
   module: "grammar",
   targetId: grammar.id,
  }),
 );
}

function buildTextItems(lesson: HanziHomeLesson) {
 const sections = lesson.sourceLesson?.lesson.sections ?? [];
 const results: HanziHomeSearchIndexItem[] = [];

 sections.forEach((section) => {
  const sectionRecord = asRecord(section);
  const sectionType = text(sectionRecord, "type");
  if (sectionType !== "text" && sectionType !== "reading") return;

  const sectionTitle =
   text(sectionRecord, "title_vi") || text(sectionRecord, "title") || "Bài khóa";
  results.push(
   createItem({
    id: `section:${lesson.id}:${section.id}`,
    kind: sectionType === "reading" ? "section" : "lesson_text",
    title: sectionTitle,
    subtitle: lessonContext(lesson, sectionType === "reading" ? "Đọc hiểu" : "Bài khóa"),
    body: stringsFromValue(sectionRecord).join(" "),
    lesson,
    module: "lessonText",
    targetId: section.id,
   }),
  );

  const blocks = Array.isArray(sectionRecord.blocks) ? sectionRecord.blocks : [];
  const items = Array.isArray(sectionRecord.items) ? sectionRecord.items : [];
  [...blocks, ...items].forEach((value, index) => {
   const block = asRecord(value);
   const targetId = text(block, "id") || `${section.id}:${index}`;
   const title =
    text(block, "title_vi") ||
    text(block, "title") ||
    text(block, "zh") ||
    `${sectionTitle} ${index + 1}`;

   results.push(
    createItem({
     id: `lesson-text:${lesson.id}:${targetId}`,
     kind: "lesson_text",
     title,
     subtitle: lessonContext(lesson, sectionTitle),
     body: stringsFromValue(block).join(" "),
     lesson,
     module: "lessonText",
     targetId: section.id,
     metadata: {
      contentNodeId: targetId,
     },
    }),
   );
  });
 });

 return results;
}

function buildExerciseItems(lesson: HanziHomeLesson) {
 const sections = lesson.sourceLesson?.lesson.sections ?? [];
 const results: HanziHomeSearchIndexItem[] = [];

 sections.forEach((section) => {
  const sectionRecord = asRecord(section);
  if (text(sectionRecord, "type") !== "exercises") return;

  const exercises = Array.isArray(sectionRecord.items) ? sectionRecord.items : [];
  exercises.forEach((value, index) => {
   const exercise = asRecord(value);
   const targetId = text(exercise, "id") || `${section.id}:${index}`;
   const title = text(exercise, "title_vi") || text(exercise, "title") || `Bài tập ${index + 1}`;

   results.push(
    createItem({
     id: `exercise:${lesson.id}:${targetId}`,
     kind: "exercise",
     title,
     subtitle: lessonContext(lesson, "Bài tập"),
     body: stringsFromValue(exercise).join(" "),
     lesson,
     module: "lessonText",
     targetId: section.id,
     metadata: {
      exerciseType: text(exercise, "type") || "unknown",
      contentNodeId: targetId,
     },
    }),
   );
  });
 });

 return results;
}

function buildLessonNavigationItems(lesson: HanziHomeLesson) {
 const baseBody = [
  lesson.title,
  lesson.titleZh,
  lesson.bookTitle,
  lesson.courseTitle,
  `bai ${lesson.lessonNumber}`,
  `bài ${lesson.lessonNumber}`,
  `q${lesson.courseId?.includes("q3") ? "3" : "2"} bai ${lesson.lessonNumber}`,
 ].join(" ");
 const modules: Array<[HanziHomeModule, string]> = [
  ["overview", "Tổng quan"],
  ["lessonText", "Bài khóa"],
  ["vocab", "Từ vựng"],
  ["grammar", "Ngữ pháp"],
  ["review", "Ôn tập"],
  ["notes", "Ghi chú"],
 ];

 return modules.map(([module, label]) =>
  createItem({
   id: `navigation:${lesson.id}:${module}`,
   kind: "navigation",
   title: module === "overview" ? `Bài ${lesson.lessonNumber}: ${lesson.titleZh}` : label,
   subtitle: lessonContext(lesson, label),
   body: `${baseBody} ${label}`,
   lesson,
   module,
  }),
 );
}

function buildRadicalItems(radicals: StaticRadicalData[]) {
 return radicals.map((radical) => {
  const record = asRecord(radical);
  const title = text(record, "radical") || text(record, "character");
  return createItem({
   id: `radical:${text(record, "id") || title}`,
   kind: "radical",
   title,
   subtitle: `Bộ thủ · ${text(record, "nameVi") || text(record, "meaning_vi")}`,
   body: stringsFromValue(record).join(" "),
   module: "radicals",
   targetId: text(record, "id"),
   href: "/radicals",
  });
 });
}

function buildGlobalNavigationItems() {
 const items: Array<[string, string, string, HanziHomeSearchKind]> = [
  ["navigation:library", "Thư viện HanziHome", "/", "navigation"],
  ["navigation:vocab", "Tổng hợp từ vựng", "/vocab", "navigation"],
  ["navigation:grammar", "Tổng hợp ngữ pháp", "/grammar", "navigation"],
  ["navigation:radicals", "Bộ thủ", "/radicals", "navigation"],
  ["navigation:notes", "Ghi chú", "/notes", "note"],
  ["navigation:dictionary", "SRS từ vựng", "/dictionary", "navigation"],
 ];

 return items.map(([id, title, href, kind]) =>
  createItem({
   id,
   kind,
   title,
   subtitle: "Điều hướng",
   body: title,
   href,
   module: id === "navigation:radicals" ? "radicals" : undefined,
  }),
 );
}

export function buildHanziHomeSearchIndex(data: HanziHomeData) {
 return [
  ...data.lessons.flatMap((lesson) => [
   ...buildLessonNavigationItems(lesson),
   ...buildVocabItems(lesson),
   ...buildGrammarItems(lesson),
   ...buildTextItems(lesson),
   ...buildExerciseItems(lesson),
  ]),
  ...buildRadicalItems(data.radicals),
  ...buildGlobalNavigationItems(),
 ];
}
