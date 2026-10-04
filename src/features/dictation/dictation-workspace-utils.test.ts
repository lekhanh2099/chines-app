import { describe, expect, it } from "vitest";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { DictationAttempt } from "./dictation-session";
import {
 dictationBookOptions,
 dictationLessonSelection,
 dictationReaderDocumentId,
 readerDictationEntries,
 customDictationEntries,
 dictationActiveEntryIndex,
 dictationPlaybackTexts,
 dictationEntryText,
 dictationEntryPinyin,
 dictationEntryMeaning,
 dictationLessonLabel,
 dictationMistakeItem,
 dictationPracticePayload,
 externalDictationEntry,
 READER_DICTATION_BOOK_ID,
} from "./dictation-workspace-utils";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";
import {
 readerDocumentRowSchema,
 readerParagraphRowSchema,
} from "@/features/reading/model/reading-resource.schemas";

function lesson(id: string, bookId: string, bookTitle: string): HanziHomeLesson {
 return {
  id,
  bookId,
  bookTitle,
  lessonNumber: 2,
  titleZh: "朋友",
  title: "Bạn",
  vocabIds: [],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
 };
}
describe("dictation source and submission policies", () => {
 it("selects lessons within the chosen volume and resets the Reader course volume", () => {
  const lessons = [
   lesson("one", "course:book:hsk3-volume-1", "HSK 3（上）"),
   lesson("two", "course:book:hsk3-volume-2", "HSK 3（下）"),
  ];
  const books = dictationBookOptions(lessons);
  const selected = dictationLessonSelection(
   lessons,
   books,
   "course:book:hsk3",
   "course:book:hsk3-volume-2",
   "one",
  );
  expect(selected.visibleLessons.map((item) => item.id)).toEqual(["two"]);
  expect(selected.selectedLessonId).toBe("two");
  const reader = dictationLessonSelection(
   lessons,
   books,
   READER_DICTATION_BOOK_ID,
   "course:book:hsk3-volume-2",
   "two",
  );
  expect(reader.isReaderCoursePack).toBe(true);
  expect(reader.selectedVolumeId).toBe("");
  expect(reader.visibleLessons).toEqual([]);
  expect(dictationLessonSelection([], dictationBookOptions([]), "", "", "").selectedLessonId).toBe(
   "",
  );
 });
 it("keeps Reader selection priority and maps canonical paragraphs without changing pinyin", () => {
  const documents = readerDocumentRowSchema.array().parse(studioSeed.reader.documents).slice(0, 2);
  const first = documents[0];
  const second = documents[1];
  const paragraph = readerParagraphRowSchema.array().parse(studioSeed.reader.paragraphs)[0];
  if (!first || !second || !paragraph) throw new Error("Missing Reader corpus");
  expect(dictationReaderDocumentId(documents, first.id, second.id)).toBe(first.id);
  expect(dictationReaderDocumentId(documents, "missing", second.id)).toBe(second.id);
  expect(dictationReaderDocumentId(documents, "missing", "missing")).toBe(first.id);
  expect(dictationReaderDocumentId([], "", "")).toBe("");
  const entry = readerDictationEntries(
   [{ ...paragraph, vi: "" }],
   (order) => `Paragraph ${order}`,
  )[0];
  expect(entry).toMatchObject({
   id: `reader:${paragraph.id}`,
   title: `Paragraph ${paragraph.paragraph_order}`,
   transcript: { full: { zh: paragraph.zh, pinyin: paragraph.pinyin } },
  });
 });
 it("chooses active or full-passage speech and ignores empty custom input", () => {
  const entries = [
   externalDictationEntry("one", "你好。", "One", "nǐ hǎo"),
   externalDictationEntry("two", "谢谢！", "Two", "xiè xie"),
  ];
  expect(dictationActiveEntryIndex(entries, "two")).toBe(1);
  expect(dictationActiveEntryIndex(entries, "removed")).toBe(0);
  expect(dictationPlaybackTexts(entries, 1, false)).toEqual(["谢谢！"]);
  expect(dictationPlaybackTexts(entries, 1, true)).toEqual(["你好。", "谢谢！"]);
  expect(dictationPlaybackTexts([], 0, false)).toEqual([]);
  expect(customDictationEntries(" \n ", "Pasted")).toEqual([]);
  expect(customDictationEntries(" 你好。 ", "Pasted")[0]).toMatchObject({
   id: "custom:dictation",
   title: "Pasted",
   transcript: { full: { zh: "你好。" } },
  });
 });
 it("groups volumes once, orders HSK levels, and preserves the Reader source", () => {
  const lessons = [
   lesson("1", "course:book:hsk4-volume-2", "第四册（下）"),
   lesson("2", "course:book:hsk3-volume-1", "第三册（上）"),
   lesson("3", "course:book:hsk4-volume-2", "第四册（下）"),
  ];
  const books = dictationBookOptions(lessons);
  expect(books.map((book) => book.id)).toEqual([
   "course:book:hsk3",
   "course:book:hsk4",
   READER_DICTATION_BOOK_ID,
  ]);
  expect(books[1]?.volumes).toEqual([{ id: "course:book:hsk4-volume-2", title: "第四册（下）" }]);
  expect(books[0]?.title).toBe("HSK 3");
  expect(dictationBookOptions([])).toEqual([
   { id: READER_DICTATION_BOOK_ID, title: "Bài đọc giáo trình", volumes: [] },
  ]);
 });
 it("keeps source IDs, supplied pinyin and lesson label semantics", () => {
  const entry = externalDictationEntry("reader:paragraph-1", "你好。", "Chào", "nǐ hǎo");
  expect(entry.id).toBe("reader:paragraph-1");
  expect(entry.transcript.full).toEqual({ zh: "你好。", pinyin: "nǐ hǎo" });
  expect(dictationEntryText(entry)).toBe("你好。");
  expect(dictationLessonLabel(lesson("lesson-text-3", "book", "Book"))).toBe(
   "第2课 · 课文 3 · 朋友",
  );
 });
 it("selects nonempty transcript lines before full-text fallbacks", () => {
  const entry = externalDictationEntry("source", " fallback ", "Source", "fallback pinyin");
  entry.transcript.full.vi = "fallback meaning";
  entry.transcript.lines = [
   { order: 1, speakerId: "learner-source", zh: " 你好 ", pinyin: " nǐ hǎo ", vi: " Chào " },
   { order: 2, speakerId: "learner-source", zh: " ", pinyin: " ", vi: " " },
  ];
  expect(dictationEntryText(entry)).toBe("你好");
  expect(dictationEntryPinyin(entry)).toBe("nǐ hǎo");
  expect(dictationEntryMeaning(entry)).toBe("Chào");
  entry.transcript.lines = [];
  expect(dictationEntryText(entry)).toBe(" fallback ");
  expect(dictationEntryPinyin(entry)).toBe("fallback pinyin");
  expect(dictationEntryMeaning(entry)).toBe("fallback meaning");
 });
 it("builds practice and review writes from the same scored attempt", () => {
  const attempt: DictationAttempt = {
   entryId: "entry-1",
   expectedText: "你好。",
   answer: "你。",
   score: 67,
   mistakeCount: 1,
   responseMs: 1000,
  };
  expect(dictationPracticePayload(attempt)).toEqual({
   surface: "dictation",
   contentId: "entry-1",
   direction: null,
   answer: { expectedText: "你好。", answer: "你。", mistakeCount: 1 },
   scorePercent: 67,
   responseMs: 1000,
  });
  expect(dictationMistakeItem(attempt, "2026-10-04T00:00:00Z")).toMatchObject({
   id: "dictation:entry-1",
   stable_key: "dictation:entry-1",
   source_id: "entry-1",
   user_answer: "你。",
   error_key: "mistakes:1",
   due_at: "2026-10-04T00:00:00Z",
   revision: 0,
  });
 });
});
