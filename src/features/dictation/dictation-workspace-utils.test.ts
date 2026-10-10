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
 dictationCardModels,
 dictationResponseMs,
 studioDictationEditorModel,
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
 it("keeps the latest Studio feedback separate from its best score and advance policy", () => {
  const entry = externalDictationEntry("one", "你好。", "One", "nǐ hǎo");
  const perfect: DictationAttempt = {
   entryId: "one",
   expectedText: "你好。",
   answer: "你好。",
   score: 100,
   mistakeCount: 0,
   responseMs: null,
  };
  const incomplete: DictationAttempt = {
   ...perfect,
   answer: "你。",
   score: 50,
   mistakeCount: 1,
  };
  const input: Parameters<typeof studioDictationEditorModel>[0] = {
   entry,
   answer: "你。",
   history: [perfect, incomplete],
   isDirty: false,
   index: 0,
   total: 2,
  };
  expect(studioDictationEditorModel(input)).toMatchObject({
   attempt: incomplete,
   isChecked: true,
   target: "你好。",
   characterCount: 3,
   bestScore: 100,
   summary: { correct: 1, missing: 1, replaced: 0, extra: 0, transposed: 0 },
   canAdvance: false,
   isCheckDisabled: false,
  });
  const correctInput = { ...input, answer: "你好。", history: [perfect] };
  expect(studioDictationEditorModel(correctInput).canAdvance).toBe(true);
  expect(studioDictationEditorModel({ ...correctInput, index: 1 }).canAdvance).toBe(false);
  expect(studioDictationEditorModel({ ...correctInput, isDirty: true })).toMatchObject({
   isChecked: false,
   diff: [],
   summary: null,
   bestScore: 100,
   canAdvance: false,
  });
 });

 it("starts Studio unanswered without feedback and counts Unicode characters", () => {
  const model = studioDictationEditorModel({
   entry: externalDictationEntry("one", "𠀀你好。", "One", ""),
   answer: " \n ",
   history: [],
   isDirty: false,
   index: 0,
   total: 1,
  });
  expect(model).toMatchObject({
   attempt: undefined,
   isChecked: false,
   diff: [],
   summary: null,
   characterCount: 4,
   bestScore: 0,
   canAdvance: false,
   isCheckDisabled: true,
  });
 });

 it("keeps hidden-entry numbering and clears old feedback after an answer edit", () => {
  const entries = [
   externalDictationEntry("one", "你好", "One", "nǐ hǎo"),
   externalDictationEntry("two", "谢谢", "Two", "xiè xie"),
  ];
  const attempt: DictationAttempt = {
   entryId: "two",
   expectedText: "谢谢",
   answer: "谢谢",
   score: 100,
   mistakeCount: 0,
   responseMs: 500,
  };
  const input: Parameters<typeof dictationCardModels>[0] = {
   entries,
   activeEntryId: "two",
   answers: { two: "谢谢" },
   attemptHistory: { two: [attempt] },
   dirtyAnswers: {},
  };
  const cards = dictationCardModels(input);
  expect(cards).toHaveLength(1);
  expect(cards[0]).toMatchObject({
   entry: { id: "two" },
   index: 1,
   score: 100,
   isChecked: true,
   history: [attempt],
   diff: [
    { kind: "match", value: "谢", expected: "谢", actual: "谢" },
    { kind: "match", value: "谢", expected: "谢", actual: "谢" },
   ],
  });
  expect(
   dictationCardModels({ ...input, answers: { two: "谢" }, dirtyAnswers: { two: true } })[0],
  ).toMatchObject({ answer: "谢", score: null, isChecked: false, diff: [], history: [attempt] });
  expect(dictationCardModels({ ...input, activeEntryId: "removed" })).toEqual([]);
 });

 it("starts unanswered cards without feedback and clamps response time", () => {
  const cards = dictationCardModels({
   entries: [externalDictationEntry("one", "你好", "One", "nǐ hǎo")],
   answers: {},
   attemptHistory: {},
   dirtyAnswers: {},
  });
  expect(cards[0]).toMatchObject({
   answer: "",
   history: [],
   isChecked: false,
   score: null,
   diff: [],
  });
  expect(dictationResponseMs(2500, 1000)).toBe(1500);
  expect(dictationResponseMs(500, 1000)).toBe(0);
  expect(dictationResponseMs(2500)).toBeNull();
 });

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
 it("keeps custom source identity and text while deferring pinyin until practice", () => {
  const pending = customDictationEntries(" 你好。 \n", "Pasted", false);
  expect(pending).toEqual([
   {
    id: "custom:dictation",
    title: "Pasted",
    transcript: {
     mode: "monologue",
     speakers: [{ id: "learner-source", labelZh: "练习", labelVi: "Bài luyện", voice: "neutral" }],
     lines: [{ order: 1, speakerId: "learner-source", zh: "你好。", pinyin: "" }],
     full: { zh: "你好。", pinyin: "" },
    },
   },
  ]);
  expect(customDictationEntries(" 你好。 \n", "Pasted", true)[0]?.transcript.full).toEqual({
   zh: "你好。",
   pinyin: "nǐ hǎo 。",
  });
  expect(customDictationEntries(" 你好。 \n", "Pasted")).toEqual(
   customDictationEntries(" 你好。 \n", "Pasted", true),
  );
  expect(customDictationEntries(" \n ", "Pasted", false)).toEqual([]);
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
