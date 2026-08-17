"use client";

import type { JsonFieldValue } from "@/types/json";
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
export type EditingToolsPresentation = "toolbar" | "menu";

export type PaneLayout = {
 left: StudyModule[];
 right: StudyModule[];
 activeLeft: StudyModule;
 activeRight: StudyModule;
};

export type DraggedModule = {
 module: StudyModule;
 sourcePane: PaneId;
};
export type NullableDraggedModule = DraggedModule | null;

export type LearningSyncStatus = "synced" | "pending" | "syncing" | "error";

export type LearningSyncUiState = {
 status: LearningSyncStatus;
 pendingCount: number;
 lastError: string | null;
 isOnline: boolean;
 retry: () => Promise<JsonFieldValue>;
};

export type ReviewItem = Pick<UserLearningState["reviewHistory"][number], "type" | "id" | "label">;

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
 answerReview: (item: ReviewItem, result: ReviewResult) => void;
};
