import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UniversalAmbientPip } from "./UniversalAmbientPip";
import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { adaptTextbookGrammarToPip } from "./pip-grammar-adapter";
import { adaptTextbookPracticeToUniversal } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import { textbookLessonToReviewLesson } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

const { mockLearningState } = vi.hoisted(() => ({
 mockLearningState: {
  state: {
   settings: { customVocab: [] },
   progress: { vocab: {}, grammar: {} },
   bookmarks: { lessons: [], vocab: [], grammar: [], radicals: [] },
   reviewHistory: [],
  },
  isLoading: false,
  isSaving: false,
  isError: false,
  isOnline: true,
  syncStatus: "synced",
  durability: "durable",
  pendingSyncCount: 0,
  lastSyncError: null,
  retrySync: async () => ({ status: "synced", syncedCount: 0, pendingCount: 0 }),
  updateSettings: () => undefined,
  updateVocabProgress: () => undefined,
  updateGrammarProgress: () => undefined,
  toggleBookmark: () => undefined,
  appendReviewHistory: () => undefined,
  recordReview: () => undefined,
  addCustomVocab: () => undefined,
  updateCustomVocab: () => undefined,
  removeCustomVocab: () => undefined,
  toggleCustomVocabByHanzi: () => undefined,
 } satisfies ReturnType<typeof useLearningState>,
}));

vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => mockLearningState,
}));

vi.mock("@/features/speech/MandarinTtsProvider", () => ({
 useMandarinTtsControls: () => ({
  isSpeaking: false,
  isLoading: false,
  speakingRequestText: null,
  speakSequence: vi.fn(),
  stop: vi.fn(),
 }),
}));

describe("UniversalAmbientPip", () => {
 const lesson = getTextbookLesson("nhip-cau", 5);
 if (!lesson) throw new Error("Lesson not found");
 const reviewLesson = textbookLessonToReviewLesson(lesson);
 const grammarPoints = adaptTextbookGrammarToPip(lesson.sections);
 const practiceBlocks = lesson.sections
  .filter((sec) => sec.category === "practice")
  .flatMap((sec) => sec.blocks);
 const practiceItems = adaptTextbookPracticeToUniversal(practiceBlocks);

 it("renders mode switcher with counts for vocab, grammar, and practice", () => {
  const html = renderToStaticMarkup(
   createElement(UniversalAmbientPip, {
    initialMode: "vocab",
    vocabItems: reviewLesson.vocab,
    grammarItems: grammarPoints,
    practiceItems: practiceItems,
    lessonTitle: "BÀI 5: 话说'面的'",
   }),
  );

  expect(html).toContain(`Từ vựng (${reviewLesson.vocab.length})`);
  expect(html).toContain(`Chép từ (${reviewLesson.vocab.length})`);
  expect(html).toContain(`Ngữ pháp (${grammarPoints.length})`);
  expect(html).toContain(`Bài tập (${practiceItems.length})`);
 });

 it("renders dictation mode directly when requested as initialMode", () => {
  const html = renderToStaticMarkup(
   createElement(UniversalAmbientPip, {
    initialMode: "dictation",
    vocabItems: reviewLesson.vocab,
    grammarItems: grammarPoints,
    practiceItems: practiceItems,
    lessonTitle: "BÀI 5: 话说'面的'",
   }),
  );

  expect(html).toContain(`1/${reviewLesson.vocab.length}`);
  expect(html).toContain("Gõ chữ Hán rồi bấm Enter...");
  expect(html).toContain("Nghe lại");
 });

 it("renders grammar mode directly when requested as initialMode", () => {
  const html = renderToStaticMarkup(
   createElement(UniversalAmbientPip, {
    initialMode: "grammar",
    vocabItems: reviewLesson.vocab,
    grammarItems: grammarPoints,
    practiceItems: practiceItems,
    lessonTitle: "BÀI 5: 话说'面的'",
   }),
  );

  expect(html).toContain(`1/${grammarPoints.length}`);
  expect(html).toContain("得慌");
 });

 it("renders practice mode directly when requested as initialMode", () => {
  const html = renderToStaticMarkup(
   createElement(UniversalAmbientPip, {
    initialMode: "practice",
    vocabItems: reviewLesson.vocab,
    grammarItems: grammarPoints,
    practiceItems: practiceItems,
    lessonTitle: "BÀI 5: 话说'面的'",
   }),
  );

  expect(html).toContain(`Câu 1/${practiceItems.length}`);
  expect(html).toContain("Kiểm tra");
 });
});
