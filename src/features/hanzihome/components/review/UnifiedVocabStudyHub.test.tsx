import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 getItWebVocabCorpus,
 getItWebVocabItemsByFilter,
} from "@/features/hanzihome/static-json/it-web-vocab-static-content";
import { mergeLearningStateAfterConflict } from "@/features/hanzihome/local/learning-state-conflict-merge";
import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";
import {
 buildExercisesFromVocabItems,
 buildStudyBundleFromBookmarkedLessons,
 customVocabListToHanziHomeVocabItems,
 getBookmarkedTextbookGroups,
 parseBulkCustomVocabInput,
} from "./vocab-hub-adapter";
import { UnifiedVocabStudyHub } from "./UnifiedVocabStudyHub";

const { mockLearningState } = vi.hoisted(() => ({
 mockLearningState: {
  state: {
   settings: {
    customVocab: [
     {
      id: "cv-1",
      hanzi: "排期",
      pinyin: "páiqī",
      meaning: "Lên lịch / xếp lịch làm",
      exampleZh: "这个需求什么时候能排期？",
      exampleVi: "Yêu cầu này khi nào xếp lịch làm được?",
      createdAt: "2026-11-07T00:00:00.000Z",
     },
    ],
   },
   progress: { vocab: {}, grammar: {} },
   bookmarks: {
    lessons: ["nhip-cau-lesson-01", "doc-hieu-lesson-01"],
    vocab: [],
    grammar: [],
    radicals: [],
   },
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

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("UnifiedVocabStudyHub & Vocab Hub Adapter", () => {
 it("loads the IT / Web communication vocabulary corpus with 10 groups and core-20 day-1 preset", () => {
  const corpus = getItWebVocabCorpus();
  expect(corpus.groups.length).toBe(10);
  expect(corpus.meta.vocabCount).toBeGreaterThanOrEqual(250);
  expect(corpus.sentences.length).toBeGreaterThanOrEqual(15);

  const core20 = getItWebVocabItemsByFilter({ preset: "core20" });
  expect(core20.length).toBe(20);
  expect(core20.some((item) => item.hanzi.includes("需求"))).toBe(true);
  expect(core20.some((item) => item.hanzi.includes("排查"))).toBe(true);
  expect(core20.some((item) => item.hanzi.includes("上线"))).toBe(true);

  const firstGroup = corpus.groups[0];
  if (!firstGroup) throw new Error("Expected first IT group");
  const group1 = getItWebVocabItemsByFilter({ preset: "all", groupIds: [firstGroup.id] });
  expect(group1.length).toBe(firstGroup.items.length);
 });

 it("filters textbook groups strictly to bookmarked lessons and builds combined study bundles", () => {
  const emptyGroups = getBookmarkedTextbookGroups([]);
  expect(emptyGroups).toHaveLength(0);

  const nhipCau1 = getTextbookLesson("nhip-cau", 1);
  const docHieu1 = getTextbookLesson("doc-hieu", 1);
  if (!nhipCau1 || !docHieu1) throw new Error("Expected textbook fixtures");

  const bookmarkedIds = [nhipCau1.id, docHieu1.id];
  const groups = getBookmarkedTextbookGroups(bookmarkedIds);
  expect(groups.length).toBe(2);
  expect(groups.map((g) => g.bookKey)).toEqual(["nhip-cau", "doc-hieu"]);
  expect(groups.every((g) => g.lessons.length === 1)).toBe(true);

  const selectedEntries = groups.flatMap((g) => g.lessons);
  const bundle = buildStudyBundleFromBookmarkedLessons(selectedEntries);
  expect(bundle.vocabItems.length).toBeGreaterThan(20);
  expect(bundle.practiceItems.length).toBeGreaterThan(10);
 });

 it("parses multi-format bulk custom vocabulary input and generates contextual exercises", () => {
  const rawInput = [
   "排期 | páiqī | Lên lịch làm | 这个需求什么时候能排期？",
   "联调\tliántiáo\tTest tích hợp FE-BE\t下午我们联调一下接口。",
   "上线 - shàngxiàn - Go-live / đưa lên bản thật",
  ].join("\n");

  const parsed = parseBulkCustomVocabInput(rawInput);
  expect(parsed).toHaveLength(3);
  expect(parsed[0]).toMatchObject({
   hanzi: "排期",
   pinyin: "páiqī",
   meaning: "Lên lịch làm",
   exampleZh: "这个需求什么时候能排期？",
  });
  expect(parsed[1]?.hanzi).toBe("联调");
  expect(parsed[2]?.hanzi).toBe("上线");

  const vocabItems = customVocabListToHanziHomeVocabItems(
   parsed.map((item, idx) => ({
    ...item,
    id: `custom-${idx}`,
    createdAt: "2026-11-07T00:00:00.000Z",
   })),
  );
  const exercises = buildExercisesFromVocabItems(vocabItems);
  expect(exercises.length).toBeGreaterThanOrEqual(4);
  expect(exercises.some((ex) => ex.category === "vocab_cloze")).toBe(true);
 });

 it("merges customVocab items without data loss on conflict", () => {
  const base = emptyLearningState;
  const local = {
   ...emptyLearningState,
   settings: {
    customVocab: [
     {
      id: "local-1",
      hanzi: "排期",
      pinyin: "páiqī",
      meaning: "Lên lịch",
      createdAt: "2026-11-07T01:00:00.000Z",
     },
    ],
   },
  };
  const remote = {
   ...emptyLearningState,
   settings: {
    customVocab: [
     {
      id: "remote-1",
      hanzi: "联调",
      pinyin: "liántiáo",
      meaning: "Test tích hợp",
      createdAt: "2026-11-07T02:00:00.000Z",
     },
    ],
   },
  };

  const merged = mergeLearningStateAfterConflict({ base, local, remote });
  expect(merged.settings.customVocab).toHaveLength(2);
  expect(merged.settings.customVocab?.map((w) => w.hanzi)).toEqual(["联调", "排期"]);
 });

 it("renders UnifiedVocabStudyHub as a compact 2-row hub with custom Select triggers", () => {
  const markup = renderToStaticMarkup(<UnifiedVocabStudyHub />);
  expect(markup).toContain("Học từ vựng &amp; Bài tập PiP");
  expect(markup).toContain("Bài đã mark (1)");
  expect(markup).toContain("Ôn tất cả (1 bài · 60 từ)");
  expect(markup).toContain("Mở PiP học ngay");
  expect(markup).toContain("Chọn nguồn từ vựng");
  expect(markup).toContain("Chọn bài học đã đánh dấu");
 });
});
