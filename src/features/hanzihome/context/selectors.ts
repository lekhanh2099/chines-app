"use client";

import { useSelector } from "@tanstack/react-store";

import type { HanziHomeFeatureState } from "./hanzihomeFeatureStore";
import { useHanziHomeFeatureContext } from "./hanzihomeFeatureContext";

export function useHanziHomeFeatureSelector<TSelected>(
 selector: (state: HanziHomeFeatureState) => TSelected,
 options?: { compare?: (a: TSelected, b: TSelected) => boolean },
) {
 const { store } = useHanziHomeFeatureContext();
 return useSelector(store, selector, options);
}

export function useHanziHomeEditMode() {
 return useHanziHomeFeatureSelector((state) => state.editMode);
}

export function useHanziHomeActiveEditableNode() {
 return useHanziHomeFeatureSelector((state) => state.activeNode);
}

export function useHanziHomeWorkspaceLayout() {
 return useHanziHomeFeatureSelector((state) => ({
  splitEnabled: state.splitEnabled,
  paneLayout: state.paneLayout,
  draggedModule: state.draggedModule,
  viewMode: state.viewMode,
  splitPaneSize: state.splitPaneSize,
 }));
}
