"use client";

import type {
 HanziHomeLesson,
 HanziHomeModule,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

export type StudyModule = Exclude<HanziHomeModule, "radicals">;
export type PaneId = "left" | "right";
export type LessonViewMode = "study" | "debug";

export type DraggedModule = {
 module: StudyModule;
 sourcePane: PaneId;
};

export type PaneLayout = {
 left: StudyModule[];
 right: StudyModule[];
 activeLeft: StudyModule;
 activeRight: StudyModule;
};

export type LearningSyncUiState = {
 status: "synced" | "pending" | "syncing" | "error";
 pendingCount: number;
 lastError: string | null;
 isOnline: boolean;
 retry: () => Promise<unknown>;
};

export type HanziHomeFeatureRuntime = {
 originalLesson: HanziHomeLesson;
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 learningSync?: LearningSyncUiState;
 activeModule: StudyModule;
 selectModule: (module: StudyModule) => void;
 updateLearningSettings: (settings: Partial<UserLearningState["settings"]>) => void;
 bookmarkVocab: (id: string) => void;
 markVocab: (id: string, status: LearningStatus) => void;
 bookmarkGrammar: (id: string) => void;
 markGrammar: (id: string, status: LearningStatus) => void;
 answerReview: (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => void;
};
