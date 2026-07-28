import type {
 LearningProgressItem,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";
import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import { z } from "zod";

const PartialLearningStateSchema = userLearningStateSchema.partial().nullable().optional();

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

export function normalizeLearningState(
 value: z.infer<typeof PartialLearningStateSchema>,
): UserLearningState {
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
