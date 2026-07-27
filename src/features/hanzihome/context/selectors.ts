"use client";

import { useMemo } from "react";
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
 const splitEnabled = useHanziHomeFeatureSelector((state) => state.splitEnabled);
 const paneLayout = useHanziHomeFeatureSelector((state) => state.paneLayout);
 const activePane = useHanziHomeFeatureSelector((state) => state.activePane);
 const draggedModule = useHanziHomeFeatureSelector((state) => state.draggedModule);
 const viewMode = useHanziHomeFeatureSelector((state) => state.viewMode);
 const splitPaneSize = useHanziHomeFeatureSelector((state) => state.splitPaneSize);

 return useMemo(
  () => ({ splitEnabled, paneLayout, activePane, draggedModule, viewMode, splitPaneSize }),
  [activePane, draggedModule, paneLayout, splitEnabled, splitPaneSize, viewMode],
 );
}
