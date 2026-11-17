import type { JsonObject, JsonValue } from "@/types/json";

import type { ExerciseCoverage, LessonCoverage, SectionCoverage } from "./conversion-coverage";
import { createExerciseCoverage } from "./conversion-coverage";
import {
 arrayValue,
 asRecord,
 byOrder,
 cleanText,
 recordList,
 stripLeadingPictographs,
 textOf,
} from "./conversion-text";
import { writeGrammarPoints, writeNotes } from "./convert-grammar";
import { writeSummary } from "./convert-summary";
import { writeLessonText, writeLessonTextFromMarkdown } from "./convert-text";
import type { CourseBook, CourseLesson, CourseSection } from "./course-book.schema";
import { courseBookSchema } from "./course-book.schema";
import type { CourseExport, CourseLessonRow, CourseSectionRow } from "./course-export.schema";
import { wordEntries, wordTableRows } from "./exercise-lists";
import { writeExerciseNode } from "./exercise-node";
import { ExerciseOutput } from "./exercise-output";
import { writeQuestionList } from "./exercise-questions";
import { findIgnoredText } from "./ignored-text";
import { SectionWriter } from "./section-writer";

export type CourseBookConversion = { book: CourseBook; coverage: LessonCoverage[] };

const CHINESE_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function chineseNumber(value: number) {
 const tens = Math.floor(value / 10);
 const units = value % 10;
 if (value > 99) return String(value);
 if (tens === 0) return CHINESE_DIGITS[units] ?? "";
 return `${tens > 1 ? (CHINESE_DIGITS[tens] ?? "") : ""}十${units > 0 ? (CHINESE_DIGITS[units] ?? "") : ""}`;
}

/** Builds the output sections of one lesson in order and numbers the ones with content. */
class LessonBuilder {
 readonly sections: CourseSection[] = [];
 readonly sectionCoverage: SectionCoverage[] = [];
 readonly exercises: ExerciseCoverage[] = [];

 constructor(
  readonly lessonId: string,
  private readonly rows: readonly CourseSectionRow[],
 ) {}

 /** `中文 (Tiếng Việt)` title of the source section, or `fallback` when the lesson has none. */
 title(sectionType: string, fallback: string) {
  const row = this.rows.find((candidate) => candidate.section_type === sectionType);
  const title = cleanText(row?.title ?? "");
  const titleVi = cleanText(row?.title_vi ?? "");
  if (!title) return fallback;
  return titleVi && titleVi !== title ? `${title} (${titleVi})` : title;
 }

 payloads(sectionType: string): JsonObject[] {
  return this.rows
   .filter((row) => row.section_type === sectionType)
   .map((row) => asRecord(row.payload));
 }

 /** Runs `fill` on a fresh section writer and keeps the section when it wrote any block. */
 add(
  title: string,
  category: CourseSection["category"],
  sectionType: string,
  sourceItems: number,
  fill: (writer: SectionWriter) => void,
 ) {
  const writer = new SectionWriter(this.lessonId, this.sections.length + 1);
  fill(writer);
  if (writer.blocks.length > 0) this.sections.push(writer.toSection(title, category));
  if (sourceItems > 0 || writer.blocks.length > 0) {
   this.sectionCoverage.push({
    lessonId: this.lessonId,
    sectionType,
    sourceItems,
    emittedBlocks: writer.blocks.length,
   });
  }
 }

 /** Writes one exercise-like item and records what it produced. */
 item(writer: SectionWriter, sectionType: string, node: JsonObject, positionalAnswers: boolean) {
  const coverage = createExerciseCoverage({
   lessonId: this.lessonId,
   sectionType,
   itemId: textOf(node.id),
   itemType: textOf(node.type) || sectionType,
   title: stripLeadingPictographs(textOf(node.title) || textOf(node.title_vi)),
  });
  this.exercises.push(coverage);
  const output = new ExerciseOutput(writer, coverage);
  writeExerciseNode(node, { output, answersById: new Map(), positionalAnswers }, 0);
 }
}

function countItems(payloads: readonly JsonObject[], keys: readonly string[]) {
 return payloads.reduce(
  (total, payload) => total + keys.reduce((sum, key) => sum + arrayValue(payload, key).length, 0),
  0,
 );
}

function textUnits(payloads: readonly JsonObject[]) {
 return payloads
  .flatMap((payload) => recordList(payload.blocks))
  .reduce(
   (total, block) =>
    total +
    arrayValue(block, "lines").length +
    arrayValue(block, "paragraphs").length +
    recordList(block.scenes).reduce((sum, scene) => sum + arrayValue(scene, "lines").length, 0),
   0,
  );
}

/** Items of an item-list section (`items`, or `blocks` when the import used that key). */
function sectionItems(payload: JsonObject): JsonObject[] {
 const items = recordList(payload.items);
 return byOrder(items.length > 0 ? items : recordList(payload.blocks));
}

const SECTION_ROOT_KEYS = [
 "questions",
 "supplementary_vocab",
 "supplementary_vocabulary",
 "vocabulary",
 "key_phrases",
];

/** Content a reading section keeps beside its items (root questions, vocabulary, key phrases). */
function sectionRemainder(payload: JsonObject): JsonObject {
 const rest: JsonObject = { id: `${textOf(payload.id)}-root`, type: "section_root" };
 for (const key of SECTION_ROOT_KEYS) rest[key] = payload[key];
 return rest;
}

function addTextSections(
 builder: LessonBuilder,
 courseExport: CourseExport,
 lesson: CourseLessonRow,
) {
 const payloads = builder.payloads("text");
 const questions: JsonValue[] = [];
 let fallback = false;
 builder.add(
  builder.title("text", "课文 (Bài khóa)"),
  "text",
  "text",
  textUnits(payloads),
  (writer) => {
   payloads.forEach((payload) => questions.push(...writeLessonText(payload, writer)));
   if (writer.blocks.some((block) => block.type === "paragraph")) return;
   const texts = courseExport.texts.filter(
    (text) => text.lesson_id === lesson.id && text.deleted_at === null,
   );
   fallback = texts.length > 0;
   writeLessonTextFromMarkdown(texts, writer);
  },
 );
 return { questions, fallback };
}

function addPracticeSections(builder: LessonBuilder, comprehensionQuestions: JsonValue[]) {
 builder.add(
  "课文理解 (Câu hỏi bài khóa)",
  "practice",
  "text.comprehension_questions",
  comprehensionQuestions.length,
  (writer) => {
   if (comprehensionQuestions.length === 0) return;
   const coverage = createExerciseCoverage({
    lessonId: builder.lessonId,
    sectionType: "text",
    itemId: "comprehension_questions",
    itemType: "comprehension_questions",
    title: "课文理解",
   });
   builder.exercises.push(coverage);
   writeQuestionList(
    comprehensionQuestions,
    { siblingAnswers: [], positionalAnswers: false },
    new ExerciseOutput(writer, coverage),
   );
  },
 );
 const itemSections = [
  { type: "exercises", title: "练习 (Bài tập)" },
  { type: "reading", title: "阅读 (Bài đọc)" },
  { type: "communication", title: "交际会话 (Hội thoại giao tiếp)" },
 ];
 for (const section of itemSections) {
  const payloads = builder.payloads(section.type);
  builder.add(
   builder.title(section.type, section.title),
   "practice",
   section.type,
   countItems(payloads, ["items", "blocks"]),
   (writer) => {
    for (const payload of payloads) {
     const positional = arrayValue(payload, "source_answer_paragraphs").length > 0;
     sectionItems(payload).forEach((item) => builder.item(writer, section.type, item, positional));
     if (section.type === "reading")
      builder.item(writer, section.type, sectionRemainder(payload), positional);
    }
   },
  );
 }
 const writing = builder.payloads("character_writing");
 builder.add(
  builder.title("character_writing", "写汉字 (Viết chữ Hán)"),
  "practice",
  "character_writing",
  countItems(writing, ["items", "suggested_generated_items"]),
  (writer) => {
   const records = writing.flatMap((payload) => [
    ...recordList(payload.items),
    ...recordList(payload.suggested_generated_items),
   ]);
   writer.table(wordTableRows(wordEntries(records).length > 0 ? records : []));
  },
 );
}

function convertLesson(
 courseExport: CourseExport,
 book: Pick<CourseBook, "key" | "label">,
 lesson: CourseLessonRow,
): { lesson: CourseLesson; coverage: LessonCoverage } {
 const number = String(lesson.lesson_number).padStart(2, "0");
 const lessonId = `${book.key}-lesson-${number}`;
 const rows = courseExport.sections
  .filter((row) => row.lesson_id === lesson.id && row.deleted_at === null)
  .sort((left, right) => left.section_order - right.section_order);
 const builder = new LessonBuilder(lessonId, rows);
 const tally = { grammarExamples: 0, grammarExamplesInline: 0 };

 const text = addTextSections(builder, courseExport, lesson);

 const properNouns = builder.payloads("proper_nouns");
 builder.add(
  builder.title("proper_nouns", "专名 (Tên riêng)"),
  "vocab",
  "proper_nouns",
  countItems(properNouns, ["items"]),
  (writer) => {
   writer.table(wordTableRows(properNouns.flatMap((payload) => recordList(payload.items))));
  },
 );

 const notes = builder.payloads("notes");
 builder.add(
  builder.title("notes", "注释 (Chú thích)"),
  "grammar",
  "notes",
  countItems(notes, ["items"]),
  (writer) => {
   notes.forEach((payload) => writeNotes(payload, writer, tally));
  },
 );
 const grammar = builder.payloads("grammar");
 const grammarPoints = courseExport.grammarPoints.filter(
  (point) => point.lesson_id === lesson.id && point.deleted_at === null,
 );
 builder.add(
  builder.title("grammar", "语法 (Ngữ pháp)"),
  "grammar",
  "grammar",
  countItems(grammar, ["items"]),
  (writer) => {
   const payloads = grammar.length > 0 ? grammar : [{}];
   payloads.forEach((payload) =>
    writeGrammarPoints(payload, grammarPoints, courseExport, writer, tally),
   );
  },
 );

 addPracticeSections(builder, text.questions);

 const summary = builder.payloads("summary");
 builder.add(
  builder.title("summary", "总结 (Tổng kết)"),
  "overview",
  "summary",
  countItems(summary, ["items", "blocks"]),
  (writer) => {
   summary.forEach((payload) => writeSummary(payload, writer));
  },
 );

 const vocabRows = courseExport.vocabItems
  .filter((item) => item.lesson_id === lesson.id && item.deleted_at === null)
  .sort((left, right) => left.item_order - right.item_order);
 const vocab = vocabRows
  .filter((item) => cleanText(item.word) && cleanText(item.meaning ?? ""))
  // The source row id keeps a word's identity when the content is regenerated.
  .map((item) => ({
   id: `${lessonId}-vocab-${item.id}`,
   hanzi: cleanText(item.word),
   traditional: "",
   pinyin: cleanText(item.pinyin ?? ""),
   pos: cleanText(item.pos_vi ?? "") || cleanText(item.pos_zh ?? ""),
   hanviet: cleanText(item.han_viet ?? ""),
   meaning: cleanText(item.meaning ?? ""),
  }));

 const titleVi = cleanText(lesson.title_vi ?? "");
 const converted: CourseLesson = {
  id: lessonId,
  bookKey: book.key,
  bookLabel: book.label,
  number: lesson.lesson_number,
  rawTitle: `BÀI ${lesson.lesson_number} (第${chineseNumber(lesson.lesson_number)}课)`,
  title: `BÀI ${lesson.lesson_number}: ${cleanText(lesson.title_zh)}`,
  intro: titleVi ? [titleVi] : [],
  sections: builder.sections,
  vocab,
 };
 return {
  lesson: converted,
  coverage: {
   lessonId,
   sourceLessonId: lesson.id,
   vocabIn: vocabRows.length,
   vocabOut: vocab.length,
   textFallback: text.fallback,
   ...tally,
   sections: builder.sectionCoverage,
   exercises: builder.exercises.filter(
    (exercise) => exercise.itemType !== "section_root" || exercise.blocks > 0,
   ),
   ignoredText: findIgnoredText(
    converted,
    rows.map((row) => ({ sectionType: row.section_type, payload: row.payload })),
   ),
  },
 };
}

/** Converts one database book (its non-deleted lessons, by `lesson_order`) to the textbook shape. */
export function convertCourseBook(
 courseExport: CourseExport,
 bookRow: CourseExport["books"][number],
): CourseBookConversion {
 const identity = courseBookSchema
  .pick({ id: true, key: true, label: true })
  .parse({ id: bookRow.id, key: bookRow.id, label: bookRow.short_title || bookRow.title });
 const lessons = courseExport.lessons
  .filter((lesson) => lesson.book_id === bookRow.id && lesson.deleted_at === null)
  .sort((left, right) => left.lesson_order - right.lesson_order)
  .map((lesson) => convertLesson(courseExport, identity, lesson));
 const book = courseBookSchema.parse({
  ...identity,
  sourceFile: `hanzihome_course_books/${bookRow.id}`,
  lessons: lessons.map((entry) => entry.lesson),
 });
 return { book, coverage: lessons.map((entry) => entry.coverage) };
}

/** One textbook-format book per non-deleted database book that has lessons, ordered by id. */
export function convertCourseBooks(courseExport: CourseExport): CourseBookConversion[] {
 return courseExport.books
  .filter(
   (book) =>
    book.deleted_at === null &&
    courseExport.lessons.some((lesson) => lesson.book_id === book.id && lesson.deleted_at === null),
  )
  .sort((left, right) => left.id.localeCompare(right.id))
  .map((book) => convertCourseBook(courseExport, book));
}
