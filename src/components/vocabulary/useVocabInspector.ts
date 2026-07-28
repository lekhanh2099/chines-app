"use client";

import { useSelector } from "@tanstack/react-store";
import { vocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import { inspectorStore } from "@/stores/inspector-store";

export function useVocabInspector() {
 const isOpen = useSelector(inspectorStore, (state) => state.isOpen);
 const { openInspector, closeInspector } = inspectorStore.actions;
 const { openDetailDrawer } = vocabDetailDrawerStore.actions;

 return { openInspector, closeInspector, isOpen, openDetailDrawer };
}
