"use client";

import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";
import type {
 HanziHomeLesson,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";
import { moduleSchema } from "@/features/hanzihome/schemas/learning-state.schema";

export const StudyModuleSchema = moduleSchema.exclude(["radicals"]);
export const PaneIdSchema = z.enum(["left", "right"]);
export const LessonViewModeSchema = z.enum(["study", "debug"]);
export const EditingToolsPresentationSchema = z.enum(["toolbar", "menu"]);
export const PaneLayoutSchema = z.object({
 left: z.array(StudyModuleSchema),
 right: z.array(StudyModuleSchema),
 activeLeft: StudyModuleSchema,
 activeRight: StudyModuleSchema,
});

export type StudyModule = z.infer<typeof StudyModuleSchema>;
export type PaneId = z.infer<typeof PaneIdSchema>;
export type LessonViewMode = z.infer<typeof LessonViewModeSchema>;
export type EditingToolsPresentation = z.infer<typeof EditingToolsPresentationSchema>;

export const DraggedModuleSchema = z.object({
 module: StudyModuleSchema,
 sourcePane: PaneIdSchema,
});
export const NullableDraggedModuleSchema = DraggedModuleSchema.nullable();
export type DraggedModule = z.infer<typeof DraggedModuleSchema>;
export type NullableDraggedModule = z.infer<typeof NullableDraggedModuleSchema>;

export type PaneLayout = z.infer<typeof PaneLayoutSchema>;

export const LearningSyncStatusSchema = z.enum(["synced", "pending", "syncing", "error"]);

export type LearningSyncUiState = {
 status: z.infer<typeof LearningSyncStatusSchema>;
 pendingCount: number;
 lastError: z.infer<z.ZodNullable<z.ZodString>>;
 isOnline: boolean;
 retry: () => Promise<JsonFieldValue>;
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
 answerReview: (item: z.infer<typeof ReviewItemSchema>, result: ReviewResult) => void;
};

export const ReviewItemSchema = z.object({
 type: z.enum(["vocab", "grammar", "radical"]),
 id: z.string(),
});
export type ReviewItem = z.infer<typeof ReviewItemSchema>;
