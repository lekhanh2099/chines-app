import { describe, expect, it } from "vitest";

import type { UserLearningState } from "@/features/hanzihome/types";
import {
 defaultLessonTextDisplaySettings,
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

import { mergeLearningStateAfterConflict } from "./learning-state-conflict-merge";

function stateWith(patch: Partial<UserLearningState>): UserLearningState {
 return normalizeLearningState({
  ...emptyLearningState,
  ...patch,
  settings: { ...emptyLearningState.settings, ...patch.settings },
  progress: { ...emptyLearningState.progress, ...patch.progress },
  bookmarks: { ...emptyLearningState.bookmarks, ...patch.bookmarks },
  reviewHistory: patch.reviewHistory ?? emptyLearningState.reviewHistory,
 });
}

describe("mergeLearningStateAfterConflict", () => {
 it("leaves library orders absent when no generation has a saved preference", () => {
  const merged = mergeLearningStateAfterConflict({
   base: emptyLearningState,
   local: emptyLearningState,
   remote: emptyLearningState,
  });

  expect(merged.settings).not.toHaveProperty("libraryCollectionOrder");
  expect(merged.settings).not.toHaveProperty("libraryResumeOrder");
 });

 it("keeps remote library reorders when the cloned local sequences are unchanged", () => {
  const base = stateWith({
   settings: {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu"],
   },
  });
  const local = stateWith({
   settings: {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu"],
    density: "compact",
   },
  });
  const remote = stateWith({
   settings: {
    libraryCollectionOrder: ["static:khau-ngu", "group:hanyu", "static:nhip-cau"],
    libraryResumeOrder: ["static:khau-ngu", "catalog:book-a"],
   },
  });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.settings.libraryCollectionOrder).toEqual(remote.settings.libraryCollectionOrder);
  expect(merged.settings.libraryResumeOrder).toEqual(remote.settings.libraryResumeOrder);
  expect(merged.settings.density).toBe("compact");
 });

 it("keeps complete local library reorders during concurrent reorders without losing unrelated remote state", () => {
  const base = stateWith({
   settings: {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu", "static:nhip-cau"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu", "static:nhip-cau"],
   },
  });
  const local = stateWith({
   settings: {
    libraryCollectionOrder: ["static:khau-ngu", "group:hanyu", "static:nhip-cau"],
    libraryResumeOrder: ["static:khau-ngu", "catalog:book-a", "static:nhip-cau"],
   },
  });
  const remote = stateWith({
   settings: {
    libraryCollectionOrder: ["static:nhip-cau", "static:khau-ngu", "group:hanyu"],
    libraryResumeOrder: ["static:nhip-cau", "static:khau-ngu", "catalog:book-a"],
    density: "compact",
    bookResume: { "static:khau-ngu": { lessonId: "khau-ngu-review-04", module: "practice" } },
    lessonTextDisplayMode: { ...defaultLessonTextDisplaySettings, hanziSize: "lg" },
   },
   progress: { vocab: { saved: { status: "known", level: 3 } } },
  });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.settings.libraryCollectionOrder).toEqual(local.settings.libraryCollectionOrder);
  expect(merged.settings.libraryResumeOrder).toEqual(local.settings.libraryResumeOrder);
  expect(merged.settings.density).toBe("compact");
  expect(merged.settings.bookResume).toEqual(remote.settings.bookResume);
  expect(merged.settings.lessonTextDisplayMode).toEqual(remote.settings.lessonTextDisplayMode);
  expect(merged.progress).toEqual(remote.progress);
 });

 it("keeps explicit local empty resets over saved remote library orders", () => {
  const base = stateWith({
   settings: {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu"],
   },
  });
  const local = stateWith({ settings: { libraryCollectionOrder: [], libraryResumeOrder: [] } });
  const remote = stateWith({
   settings: {
    libraryCollectionOrder: ["static:khau-ngu", "group:hanyu"],
    libraryResumeOrder: ["static:khau-ngu", "catalog:book-a"],
   },
  });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.settings.libraryCollectionOrder).toEqual([]);
  expect(merged.settings.libraryResumeOrder).toEqual([]);
 });

 it("distinguishes explicit empty local resets from absent legacy preferences", () => {
  const local = stateWith({ settings: { libraryCollectionOrder: [], libraryResumeOrder: [] } });
  const remote = stateWith({
   settings: {
    libraryCollectionOrder: ["static:khau-ngu", "group:hanyu"],
    libraryResumeOrder: ["static:khau-ngu", "catalog:book-a"],
   },
  });

  const merged = mergeLearningStateAfterConflict({ base: emptyLearningState, local, remote });

  expect(merged.settings.libraryCollectionOrder).toEqual([]);
  expect(merged.settings.libraryResumeOrder).toEqual([]);
 });

 it("preserves intentional local removals of saved library orders", () => {
  const base = stateWith({
   settings: {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu"],
   },
  });
  const remote = stateWith({
   settings: {
    libraryCollectionOrder: ["static:khau-ngu", "group:hanyu"],
    libraryResumeOrder: ["static:khau-ngu", "catalog:book-a"],
   },
  });

  const merged = mergeLearningStateAfterConflict({ base, local: emptyLearningState, remote });

  expect(merged.settings).not.toHaveProperty("libraryCollectionOrder");
  expect(merged.settings).not.toHaveProperty("libraryResumeOrder");
 });

 it("merges collection and resume reorders independently", () => {
  const base = stateWith({
   settings: {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu"],
   },
  });
  const collectionChange = stateWith({
   settings: {
    libraryCollectionOrder: ["static:khau-ngu", "group:hanyu"],
    libraryResumeOrder: ["catalog:book-a", "static:khau-ngu"],
   },
  });
  const resumeChange = stateWith({
   settings: {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu"],
    libraryResumeOrder: ["static:khau-ngu", "catalog:book-a"],
   },
  });

  const localCollection = mergeLearningStateAfterConflict({
   base,
   local: collectionChange,
   remote: resumeChange,
  });
  const localResume = mergeLearningStateAfterConflict({
   base,
   local: resumeChange,
   remote: collectionChange,
  });

  expect(localCollection.settings.libraryCollectionOrder).toEqual(
   collectionChange.settings.libraryCollectionOrder,
  );
  expect(localCollection.settings.libraryResumeOrder).toEqual(
   resumeChange.settings.libraryResumeOrder,
  );
  expect(localResume.settings.libraryCollectionOrder).toEqual(
   collectionChange.settings.libraryCollectionOrder,
  );
  expect(localResume.settings.libraryResumeOrder).toEqual(resumeChange.settings.libraryResumeOrder);
 });

 it("merges lesson display preferences per nested field", () => {
  const base = stateWith({
   settings: { lessonTextDisplayMode: defaultLessonTextDisplaySettings },
  });
  const local = stateWith({
   settings: {
    lessonTextDisplayMode: {
     ...defaultLessonTextDisplaySettings,
     showPinyin: false,
     autoDetectPinyin: true,
    },
   },
  });
  const remote = stateWith({
   settings: {
    lessonTextDisplayMode: {
     ...defaultLessonTextDisplaySettings,
     hanziSize: "xl",
    },
   },
  });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.settings.lessonTextDisplayMode).toEqual({
   ...defaultLessonTextDisplaySettings,
   showPinyin: false,
   autoDetectPinyin: true,
   hanziSize: "xl",
  });
 });

 it("uses product display defaults as the base for concurrent first-time preference edits", () => {
  const local = stateWith({
   settings: {
    lessonTextDisplayMode: {
     ...defaultLessonTextDisplaySettings,
     showMeaning: true,
    },
   },
  });
  const remote = stateWith({
   settings: {
    lessonTextDisplayMode: {
     ...defaultLessonTextDisplaySettings,
     hanziFont: "songti",
    },
   },
  });

  const merged = mergeLearningStateAfterConflict({
   base: emptyLearningState,
   local,
   remote,
  });

  expect(merged.settings.lessonTextDisplayMode).toEqual({
   ...defaultLessonTextDisplaySettings,
   showMeaning: true,
   hanziFont: "songti",
  });
 });

 it("applies local bookmark additions over unrelated remote additions", () => {
  const base = stateWith({ bookmarks: { lessons: ["A"] } });
  const local = stateWith({ bookmarks: { lessons: ["A", "B"] } });
  const remote = stateWith({ bookmarks: { lessons: ["A", "C"] } });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.bookmarks.lessons).toEqual(["A", "C", "B"]);
 });

 it("applies local bookmark removals while preserving unrelated remote additions", () => {
  const base = stateWith({ bookmarks: { lessons: ["A", "B"] } });
  const local = stateWith({ bookmarks: { lessons: ["B"] } });
  const remote = stateWith({ bookmarks: { lessons: ["A", "B", "C"] } });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.bookmarks.lessons).toEqual(["B", "C"]);
 });

 it("keeps the later review snapshot when both sides changed the same progress item", () => {
  const base = stateWith({
   progress: {
    vocab: {
     word: {
      level: 1,
      status: "learning",
      lastReviewedAt: "2026-08-20T01:00:00.000Z",
     },
    },
   },
  });
  const local = stateWith({
   progress: {
    vocab: {
     word: {
      level: 1,
      status: "hard",
      lastReviewedAt: "2026-08-20T02:00:00.000Z",
     },
    },
   },
  });
  const remote = stateWith({
   progress: {
    vocab: {
     word: {
      level: 3,
      status: "known",
      lastReviewedAt: "2026-08-20T03:00:00.000Z",
     },
    },
   },
  });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.progress.vocab?.word).toEqual(remote.progress.vocab?.word);
 });

 it("keeps the pending local review on an exact timestamp tie", () => {
  const base = stateWith({
   progress: {
    grammar: {
     point: {
      level: 1,
      status: "learning",
      lastReviewedAt: "2026-08-20T01:00:00.000Z",
     },
    },
   },
  });
  const local = stateWith({
   progress: {
    grammar: {
     point: {
      level: 1,
      status: "hard",
      lastReviewedAt: "2026-08-20T02:00:00.000Z",
     },
    },
   },
  });
  const remote = stateWith({
   progress: {
    grammar: {
     point: {
      level: 3,
      status: "known",
      lastReviewedAt: "2026-08-20T02:00:00.000Z",
     },
    },
   },
  });

  const merged = mergeLearningStateAfterConflict({ base, local, remote });

  expect(merged.progress.grammar?.point).toEqual(local.progress.grammar?.point);
 });
});
