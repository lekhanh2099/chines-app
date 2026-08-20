import type {
 LearningProgressItem,
 LearningStatus,
 LessonTextDisplaySettings,
 UserLearningState,
} from "@/features/hanzihome/types";
import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import { z } from "zod";

type PartialLearningState = z.infer<
 z.ZodOptional<z.ZodNullable<ReturnType<typeof userLearningStateSchema.partial>>>
>;

export const defaultLessonTextDisplaySettings: LessonTextDisplaySettings = {
 showPinyin: true,
 showMeaning: false,
 showAnswers: false,
 hanziFont: "kaiti",
 hanziSize: "3xl",
 revealMode: "always",
};

export const emptyLearningState: UserLearningState = {
 settings: {},
 progress: {
  vocab: {},
  grammar: {},
 },
 bookmarks: {
  lessons: [],
  vocab: [],
  grammar: [],
  radicals: [],
 },
 reviewHistory: [],
};

export function normalizeLearningState(value: PartialLearningState): UserLearningState {
 return {
  settings: value?.settings || {},
  progress: {
   vocab: value?.progress?.vocab || {},
   grammar: value?.progress?.grammar || {},
  },
  bookmarks: {
   lessons: value?.bookmarks?.lessons || [],
   vocab: value?.bookmarks?.vocab || [],
   grammar: value?.bookmarks?.grammar || [],
   radicals: value?.bookmarks?.radicals || [],
  },
  reviewHistory: value?.reviewHistory || [],
 };
}

export function nextProgress(status: LearningStatus): LearningProgressItem {
 const levelByStatus: Record<LearningStatus, number> = {
  new: 0,
  learning: 1,
  hard: 1,
  known: 3,
 };

 return {
  status,
  level: levelByStatus[status],
  lastReviewedAt: new Date().toISOString(),
 };
}
