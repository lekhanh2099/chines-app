import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AmbientPipFlashcard } from "./AmbientPipFlashcard";
import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
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

describe("AmbientPipFlashcard", () => {
 const lesson = getTextbookLesson("nhip-cau", 5);
 if (!lesson) throw new Error("Lesson not found");
 const reviewLesson = textbookLessonToReviewLesson(lesson);

 it("renders the hero Hanzi and context sentence prompt", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipFlashcard, {
    items: reviewLesson.vocab,
    lessonTitle: "Nhịp cầu Bài 5",
   }),
  );

  expect(html).toContain("Nhịp cầu Bài 5");
  expect(html).toContain("1/59");
  expect(html).toContain(reviewLesson.vocab[0]?.hanzi);
 });

 it("renders close button and handles in-app floating mode", () => {
  const onClose = vi.fn();
  const html = renderToStaticMarkup(
   createElement(AmbientPipFlashcard, {
    items: reviewLesson.vocab,
    onClose,
    isFloatingInApp: true,
   }),
  );

  expect(html).toContain("fixed bottom-5 right-5");
  expect(html).toContain("Đóng");
 });
});
