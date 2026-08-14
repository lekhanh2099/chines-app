import type {
 LearningProgressItem,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";
import { emptyLearningLoopState } from "@/features/hanzihome/learning-loop/learning-loop.schemas";
import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import { z } from "zod";

type PartialLearningState = z.infer<
 z.ZodOptional<z.ZodNullable<ReturnType<typeof userLearningStateSchema.partial>>>
>;

export const emptyLearningState: UserLearningState = {
 settings: {},
 progress: {
  vocab: {},
  grammar: {},
  learningLoop: emptyLearningLoopState,
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
   learningLoop: value?.progress?.learningLoop || emptyLearningLoopState,
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
