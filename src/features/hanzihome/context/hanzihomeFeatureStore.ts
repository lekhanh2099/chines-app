"use client";

import { createStore } from "@tanstack/react-store";

import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import type {
 DraggedModule,
 LessonViewMode,
 PaneLayout,
} from "./types";
import type { LearningStatus } from "@/features/hanzihome/types";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import { readWorkspacePreferences } from "./workspaceLayout";

export type HanziHomeFeatureState = {
 editMode: boolean;
 activeNode: EditableNodeRequest | null;
 splitEnabled: boolean;
 paneLayout: PaneLayout;
 draggedModule: DraggedModule | null;
 viewMode: LessonViewMode;
 splitPaneSize: number;
 vocabSelectedWordId: string | null;
 vocabSearchValue: string;
 vocabStatusFilter: "all" | LearningStatus;
 grammarSelectedPointId: string | null;
 grammarSidebarOpen: boolean;
 lessonTextSelectedSectionId: string;
 lessonTextSidebarOpen: boolean;
 lessonTextSettingsOpen: boolean;
 lessonTextDisplayMode: LessonDisplayMode;
};

export function createHanziHomeFeatureStore() {
 const preferences = readWorkspacePreferences();

 return createStore<HanziHomeFeatureState>({
  editMode: false,
  activeNode: null,
  splitEnabled: preferences.splitEnabled,
  paneLayout: preferences.paneLayout,
  draggedModule: null,
  viewMode: preferences.viewMode,
  splitPaneSize: preferences.splitPaneSize,
  vocabSelectedWordId: null,
  vocabSearchValue: "",
  vocabStatusFilter: "all",
  grammarSelectedPointId: null,
  grammarSidebarOpen: true,
  lessonTextSelectedSectionId: "__all_lesson_sections__",
  lessonTextSidebarOpen: true,
  lessonTextSettingsOpen: false,
  lessonTextDisplayMode: DEFAULT_LESSON_DISPLAY_MODE,
 });
}

export type HanziHomeFeatureStore = ReturnType<typeof createHanziHomeFeatureStore>;
