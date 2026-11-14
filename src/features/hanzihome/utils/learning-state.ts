import type {
 HanziHomeLesson,
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
 autoDetectPinyin: false,
 showMeaning: false,
 showAnswers: false,
 hanziFont: "kaiti",
 hanziSize: "3xl",
 revealMode: "always",
};

export const defaultTextbookDisplaySettings: LessonTextDisplaySettings = {
 ...defaultLessonTextDisplaySettings,
 autoDetectPinyin: true,
 showMeaning: true,
 hanziSize: "xl",
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

// Catalog IDs and static corpus IDs belong to separate namespaces.
export function lessonBookKey(lesson: Pick<HanziHomeLesson, "bookId" | "courseId">): string {
 return lesson.bookId ? `catalog:${lesson.bookId}` : `catalog-course:${lesson.courseId ?? ""}`;
}

/** Milliseconds of a recorded study time; missing/invalid times sort before all others. */
export function bookStudiedAtMs(value?: string) {
 const parsed = value ? Date.parse(value) : Number.NaN;
 return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

/** The book key with the latest `bookLastStudiedAt` time, or "" when none is recorded. */
export function mostRecentStudiedBookKey(settings: UserLearningState["settings"]): string {
 let latestKey = "";
 let latestMs = Number.NEGATIVE_INFINITY;
 for (const [key, studiedAt] of Object.entries(settings.bookLastStudiedAt ?? {})) {
  const ms = bookStudiedAtMs(studiedAt);
  if (ms > latestMs) {
   latestKey = key;
   latestMs = ms;
  }
 }
 return latestKey;
}

/**
 * Settings patch recording `bookKey` as studied now. The time is kept strictly after
 * every recorded time, so the book becomes the most recent one even when another
 * device's clock ran ahead; a writer that checks `mostRecentStudiedBookKey` first
 * therefore settles after a single write.
 */
export function markBookStudied(
 settings: UserLearningState["settings"],
 bookKey: string,
 now: Date = new Date(),
): Pick<UserLearningState["settings"], "bookLastStudiedAt"> {
 const latestMs = Math.max(
  Number.NEGATIVE_INFINITY,
  ...Object.values(settings.bookLastStudiedAt ?? {}).map(bookStudiedAtMs),
 );
 const studiedAt = new Date(Math.max(now.getTime(), latestMs + 1)).toISOString();
 return { bookLastStudiedAt: { [bookKey]: studiedAt } };
}

export function lessonDisplaySettings(
 state: UserLearningState,
 lesson: Pick<HanziHomeLesson, "bookId" | "courseId">,
): LessonTextDisplaySettings {
 return (
  state.settings.bookDisplayModes?.[lessonBookKey(lesson)] ??
  state.settings.lessonTextDisplayMode ??
  defaultLessonTextDisplaySettings
 );
}
