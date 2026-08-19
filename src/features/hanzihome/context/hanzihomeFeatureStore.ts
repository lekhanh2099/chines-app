"use client";

import { createStore } from "@tanstack/react-store";

import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import type { LearningStatus } from "@/features/hanzihome/types";
import type { DraggedModule, LessonViewMode, PaneId, PaneLayout } from "./types";
import { readWorkspacePreferences } from "./workspaceLayout";

export type HanziHomeFeatureState = {
 editMode: boolean;
 activeNode: EditableNodeRequest | null;
 splitEnabled: boolean;
 paneLayout: PaneLayout;
 activePane: PaneId;
 draggedModule: DraggedModule | null;
 viewMode: LessonViewMode;
 splitPaneSize: number;
 vocabSelectedWordId: string | null;
 vocabSearchValue: string;
 vocabStatusFilter: LearningStatus | "all";
 grammarSelectedPointId: string | null;
 grammarSidebarOpen: boolean;
 lessonTextSelectedSectionId: string;
 lessonTextSidebarOpen: boolean;
 lessonTextSettingsOpen: boolean;
};

type HanziHomeFeatureInitialSelections = Partial<{
 vocabSelectedWordId: HanziHomeFeatureState["vocabSelectedWordId"];
 grammarSelectedPointId: HanziHomeFeatureState["grammarSelectedPointId"];
 lessonTextSelectedSectionId: HanziHomeFeatureState["lessonTextSelectedSectionId"];
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
  vocabStatusFilter: "all",
  grammarSelectedPointId: initialSelections.grammarSelectedPointId ?? null,
  grammarSidebarOpen: true,
  lessonTextSelectedSectionId:
   initialSelections.lessonTextSelectedSectionId ?? "__all_lesson_sections__",
  lessonTextSidebarOpen: true,
  lessonTextSettingsOpen: false,
 };

 return createStore(initialState);
}

export type HanziHomeFeatureStore = ReturnType<typeof createHanziHomeFeatureStore>;
