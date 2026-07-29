"use client";

import { createStore } from "@tanstack/react-store";

import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import type { LessonViewMode, PaneId, PaneLayout } from "./types";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import { readWorkspacePreferences } from "./workspaceLayout";
import { learningStatusSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import { DraggedModuleSchema } from "./types";
import { z } from "zod";

const VocabStatusFilterSchema = learningStatusSchema.or(z.literal("all"));
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export type HanziHomeFeatureState = {
 editMode: boolean;
 activeNode: Nullable<EditableNodeRequest>;
 splitEnabled: boolean;
 paneLayout: PaneLayout;
 activePane: PaneId;
 draggedModule: z.infer<z.ZodNullable<typeof DraggedModuleSchema>>;
 viewMode: LessonViewMode;
 splitPaneSize: number;
 vocabSelectedWordId: z.infer<z.ZodNullable<z.ZodString>>;
 vocabSearchValue: string;
 vocabStatusFilter: z.infer<typeof VocabStatusFilterSchema>;
 grammarSelectedPointId: z.infer<z.ZodNullable<z.ZodString>>;
 grammarSidebarOpen: boolean;
 lessonTextSelectedSectionId: string;
 lessonTextSidebarOpen: boolean;
 lessonTextSettingsOpen: boolean;
 lessonTextDisplayMode: LessonDisplayMode;
};

type HanziHomeFeatureInitialSelections = Partial<{
 vocabSelectedWordId: HanziHomeFeatureState["vocabSelectedWordId"];
 grammarSelectedPointId: HanziHomeFeatureState["grammarSelectedPointId"];
 lessonTextSelectedSectionId: HanziHomeFeatureState["lessonTextSelectedSectionId"];
 lessonTextDisplayMode: HanziHomeFeatureState["lessonTextDisplayMode"];
}>;

export function createHanziHomeFeatureStore(
 initialSelections: HanziHomeFeatureInitialSelections = {},
) {
 const preferences = readWorkspacePreferences();

 const initialState: HanziHomeFeatureState = {
  editMode: false,
  activeNode: null,
  splitEnabled: preferences.splitEnabled,
  paneLayout: preferences.paneLayout,
  activePane: "left",
  draggedModule: null,
  viewMode: preferences.viewMode,
  splitPaneSize: preferences.splitPaneSize,
  vocabSelectedWordId: initialSelections.vocabSelectedWordId ?? null,
  vocabSearchValue: "",
  vocabStatusFilter: VocabStatusFilterSchema.options[1].value,
  grammarSelectedPointId: initialSelections.grammarSelectedPointId ?? null,
  grammarSidebarOpen: true,
  lessonTextSelectedSectionId:
   initialSelections.lessonTextSelectedSectionId ?? "__all_lesson_sections__",
  lessonTextSidebarOpen: true,
  lessonTextSettingsOpen: false,
  lessonTextDisplayMode: initialSelections.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE,
 };

 return createStore(initialState);
}

export type HanziHomeFeatureStore = ReturnType<typeof createHanziHomeFeatureStore>;
