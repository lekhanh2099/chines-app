"use client";

import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";

import { useHanziHomeFeatureContext } from "./hanzihomeFeatureContext";
import type { HanziHomeFeatureStore } from "./hanzihomeFeatureStore";
import type { DraggedModule, LessonViewMode, PaneLayout } from "./types";
import type { LearningStatus } from "@/features/hanzihome/types";
import type { HanziHomeFeatureState } from "./hanzihomeFeatureStore";
import {
 normalizePaneLayout,
 persistPaneLayout,
 persistSplitEnabled,
 persistSplitPaneSize,
 persistViewMode,
} from "./workspaceLayout";

function setEditMode(store: HanziHomeFeatureStore, enabled: boolean) {
 store.setState((state) => ({
  ...state,
  editMode: enabled,
  activeNode: enabled ? state.activeNode : null,
 }));
}

function openEditableNode(store: HanziHomeFeatureStore, node: EditableNodeRequest) {
 store.setState((state) => ({
  ...state,
  activeNode: node,
 }));
}

function closeEditableNode(store: HanziHomeFeatureStore) {
 store.setState((state) => ({
  ...state,
  activeNode: null,
 }));
}

export function createHanziHomeFeatureActions(store: HanziHomeFeatureStore) {
 return {
  setEditMode: (enabled: boolean) => setEditMode(store, enabled),
  openEditableNode: (node: EditableNodeRequest) => openEditableNode(store, node),
  closeEditableNode: () => closeEditableNode(store),
  setSplitEnabled: (enabled: boolean) => {
   store.setState((state) => ({ ...state, splitEnabled: enabled }));
   persistSplitEnabled(enabled);
  },
  setPaneLayout: (layout: PaneLayout) => {
   const normalized = normalizePaneLayout(layout);
   store.setState((state) => ({ ...state, paneLayout: normalized }));
   persistPaneLayout(normalized);
  },
  setDraggedModule: (draggedModule: DraggedModule | null) =>
   store.setState((state) => ({ ...state, draggedModule })),
  setViewMode: (viewMode: LessonViewMode) => {
   store.setState((state) => ({ ...state, viewMode }));
   persistViewMode(viewMode);
  },
  setSplitPaneSize: (splitPaneSize: number) => {
   store.setState((state) => ({ ...state, splitPaneSize }));
   persistSplitPaneSize(splitPaneSize);
  },
  selectVocabWord: (vocabSelectedWordId: string | null) =>
   store.setState((state) => ({ ...state, vocabSelectedWordId })),
  setVocabSearchValue: (vocabSearchValue: string) =>
   store.setState((state) => ({ ...state, vocabSearchValue })),
  setVocabStatusFilter: (vocabStatusFilter: "all" | LearningStatus) =>
   store.setState((state) => ({ ...state, vocabStatusFilter })),
  selectGrammarPoint: (grammarSelectedPointId: string | null) =>
   store.setState((state) => ({ ...state, grammarSelectedPointId })),
  setGrammarSidebarOpen: (grammarSidebarOpen: boolean) =>
   store.setState((state) => ({ ...state, grammarSidebarOpen })),
  selectLessonTextSection: (lessonTextSelectedSectionId: string) =>
   store.setState((state) => ({ ...state, lessonTextSelectedSectionId })),
  setLessonTextSidebarOpen: (lessonTextSidebarOpen: boolean) =>
   store.setState((state) => ({ ...state, lessonTextSidebarOpen })),
  setLessonTextSettingsOpen: (lessonTextSettingsOpen: boolean) =>
   store.setState((state) => ({ ...state, lessonTextSettingsOpen })),
  setLessonTextDisplayMode: (updates: Partial<HanziHomeFeatureState["lessonTextDisplayMode"]>) =>
   store.setState((state) => ({
    ...state,
    lessonTextDisplayMode: { ...state.lessonTextDisplayMode, ...updates },
   })),
 };
}

export type HanziHomeFeatureActions = ReturnType<typeof createHanziHomeFeatureActions>;

export function useHanziHomeFeatureActions() {
 return useHanziHomeFeatureContext().actions;
}
