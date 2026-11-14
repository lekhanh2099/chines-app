import { describe, expect, it } from "vitest";

import {
 emptyLearningState,
 markBookStudied,
 mostRecentStudiedBookKey,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

import {
 applyBookmarkToggle,
 applyCustomVocabAdd,
 applyCustomVocabRemove,
 applyCustomVocabToggleByHanzi,
 applyCustomVocabUpdate,
 applyGrammarProgress,
 applyReviewProgress,
 applySettingsUpdate,
 applyVocabProgress,
 reviewAttemptInput,
 reviewResultToLearningStatus,
} from "./learning-state-update-model";

const base = normalizeLearningState(emptyLearningState);

describe("learning state update model", () => {
 it("maps review results to learning statuses and attempt input", () => {
  expect(reviewResultToLearningStatus("known")).toBe("known");
  expect(reviewResultToLearningStatus("hard")).toBe("hard");
  expect(reviewResultToLearningStatus("again")).toBe("learning");
  expect(reviewAttemptInput({ type: "vocab", id: "v1", label: "你好" }, "known")).toEqual({
   itemType: "vocab",
   itemId: "v1",
   label: "你好",
   result: "known",
  });
 });

 it("records review progress in the vocab or grammar scope", () => {
  const vocab = applyReviewProgress(base, { type: "vocab", id: "v1", label: "" }, "known");
  expect(vocab.progress.vocab?.v1?.status).toBe("known");
  expect(vocab.progress.grammar).toEqual(base.progress.grammar);

  const grammar = applyReviewProgress(base, { type: "grammar", id: "g1", label: "" }, "hard");
  expect(grammar.progress.grammar?.g1?.status).toBe("hard");
  expect(grammar.progress.vocab).toEqual(base.progress.vocab);
 });

 it("updates vocab and grammar progress independently", () => {
  expect(applyVocabProgress(base, "v2", "learning").progress.vocab?.v2?.level).toBe(1);
  expect(applyGrammarProgress(base, "g2", "known").progress.grammar?.g2?.level).toBe(3);
 });

 it("merges nested per-book settings without replacing siblings", () => {
  const first = applySettingsUpdate(base, {
   bookResume: { a: { lessonId: "lesson-1", module: "text" } },
  });
  const second = applySettingsUpdate(first, {
   bookResume: { b: { lessonId: "lesson-2", module: "vocab" } },
  });
  expect(second.settings.bookResume).toEqual({
   a: { lessonId: "lesson-1", module: "text" },
   b: { lessonId: "lesson-2", module: "vocab" },
  });
 });

 it("records book study times per book and keeps A → B → A recency", () => {
  const studyA = applySettingsUpdate(base, {
   ...markBookStudied(base.settings, "catalog:a", new Date("2026-11-12T08:00:00.000Z")),
  });
  const studyB = applySettingsUpdate(studyA, {
   ...markBookStudied(studyA.settings, "static:nhip-cau", new Date("2026-11-12T09:00:00.000Z")),
  });
  expect(mostRecentStudiedBookKey(studyB.settings)).toBe("static:nhip-cau");
  const backToA = applySettingsUpdate(studyB, {
   ...markBookStudied(studyB.settings, "catalog:a", new Date("2026-11-12T10:00:00.000Z")),
  });
  expect(mostRecentStudiedBookKey(backToA.settings)).toBe("catalog:a");
  expect(backToA.settings.bookLastStudiedAt).toEqual({
   "catalog:a": "2026-11-12T10:00:00.000Z",
   "static:nhip-cau": "2026-11-12T09:00:00.000Z",
  });
 });

 it("marks a book as most recent even when another device's clock ran ahead", () => {
  const ahead = applySettingsUpdate(base, {
   bookLastStudiedAt: { "static:khau-ngu": "2030-01-01T00:00:00.000Z" },
  });
  const patch = markBookStudied(ahead.settings, "catalog:a", new Date("2026-11-12T08:00:00.000Z"));
  expect(patch.bookLastStudiedAt?.["catalog:a"]).toBe("2030-01-01T00:00:00.001Z");
  expect(mostRecentStudiedBookKey(applySettingsUpdate(ahead, patch).settings)).toBe("catalog:a");
  expect(mostRecentStudiedBookKey(base.settings)).toBe("");
 });

 it("toggles bookmarks on and off", () => {
  const added = applyBookmarkToggle(base, "lessons", "l1");
  expect(added.bookmarks.lessons).toContain("l1");
  expect(applyBookmarkToggle(added, "lessons", "l1").bookmarks.lessons).not.toContain("l1");
 });

 it("adds, updates, removes and toggles custom vocab by hanzi", () => {
  const added = applyCustomVocabAdd(base, [
   { hanzi: " 你好 ", pinyin: "nǐ hǎo", meaning: " xin chào " },
   { hanzi: "", pinyin: "", meaning: "ignored" },
  ]);
  const [item] = added.settings.customVocab ?? [];
  expect(added.settings.customVocab).toHaveLength(1);
  expect(item?.hanzi).toBe("你好");
  expect(item?.meaning).toBe("xin chào");

  const id = item?.id ?? "";
  const updated = applyCustomVocabUpdate(added, id, { meaning: "  ", note: " lưu ý " });
  expect(updated.settings.customVocab?.[0]?.meaning).toBe("xin chào");
  expect(updated.settings.customVocab?.[0]?.note).toBe("lưu ý");

  expect(applyCustomVocabRemove(updated, id).settings.customVocab).toEqual([]);

  const toggledOff = applyCustomVocabToggleByHanzi(updated, {
   hanzi: "你好",
   pinyin: "",
   meaning: "",
  });
  expect(toggledOff.settings.customVocab).toEqual([]);
  const toggledOn = applyCustomVocabToggleByHanzi(base, { hanzi: "谢谢", pinyin: "", meaning: "" });
  expect(toggledOn.settings.customVocab?.[0]?.meaning).toBe("谢谢");
  expect(applyCustomVocabToggleByHanzi(base, { hanzi: " ", pinyin: "", meaning: "" })).toBe(base);
 });
});
