"use client";

import { useHanziHomeFeatureContext } from "./hanzihomeFeatureContext";
import type { HanziHomeFeatureStore } from "./hanzihomeFeatureStore";
import type { LessonViewMode, PaneId, PaneLayout } from "./types";
import type { HanziHomeFeatureState } from "./hanzihomeFeatureStore";
import {
 normalizePaneLayout,
 persistPaneLayout,
 persistSplitEnabled,
 persistSplitPaneSize,
 persistViewMode,
} from "./workspaceLayout";

export function createHanziHomeFeatureActions(store: HanziHomeFeatureStore) {
 return {
  setSplitEnabled: (enabled: boolean) => {
   store.setState((state) => ({ ...state, splitEnabled: enabled }));
   persistSplitEnabled(enabled);
  },
  setPaneLayout: (layout: PaneLayout) => {
   const paneLayout = normalizePaneLayout(layout);
   store.setState((state) => ({ ...state, paneLayout }));
   persistPaneLayout(paneLayout);
  },
  setActivePane: (activePane: PaneId) => store.setState((state) => ({ ...state, activePane })),
  setDraggedModule: (draggedModule: HanziHomeFeatureState["draggedModule"]) =>
   store.setState((state) => ({ ...state, draggedModule })),
  setViewMode: (viewMode: LessonViewMode) => {
   store.setState((state) => ({ ...state, viewMode }));
   persistViewMode(viewMode);
  },
  setSplitPaneSize: (splitPaneSize: number) => {
   store.setState((state) => ({ ...state, splitPaneSize }));
   persistSplitPaneSize(splitPaneSize);
  },
  selectVocabWord: (vocabSelectedWordId: HanziHomeFeatureState["vocabSelectedWordId"]) =>
   store.setState((state) => ({ ...state, vocabSelectedWordId })),
  setVocabSearchValue: (vocabSearchValue: string) =>
   store.setState((state) => ({ ...state, vocabSearchValue })),
  setVocabStatusFilter: (vocabStatusFilter: HanziHomeFeatureState["vocabStatusFilter"]) =>
   store.setState((state) => ({ ...state, vocabStatusFilter })),
  selectGrammarPoint: (grammarSelectedPointId: HanziHomeFeatureState["grammarSelectedPointId"]) =>
   store.setState((state) => ({ ...state, grammarSelectedPointId })),
  setGrammarSidebarOpen: (grammarSidebarOpen: boolean) =>
   store.setState((state) => ({ ...state, grammarSidebarOpen })),
  selectLessonTextSection: (lessonTextSelectedSectionId: string) =>
   store.setState((state) => ({ ...state, lessonTextSelectedSectionId })),
  setLessonTextSidebarOpen: (lessonTextSidebarOpen: boolean) =>
   store.setState((state) => ({ ...state, lessonTextSidebarOpen })),
  setLessonTextSettingsOpen: (lessonTextSettingsOpen: boolean) =>
   store.setState((state) => ({ ...state, lessonTextSettingsOpen })),
 };
}

export type HanziHomeFeatureActions = ReturnType<typeof createHanziHomeFeatureActions>;

export function useHanziHomeFeatureActions() {
 return useHanziHomeFeatureContext().actions;
}
