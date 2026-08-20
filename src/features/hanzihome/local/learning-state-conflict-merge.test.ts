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
 it("merges lesson display preferences per nested field", () => {
  const base = stateWith({
   settings: { lessonTextDisplayMode: defaultLessonTextDisplaySettings },
  });
  const local = stateWith({
   settings: {
    lessonTextDisplayMode: {
     ...defaultLessonTextDisplaySettings,
     showPinyin: false,
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
