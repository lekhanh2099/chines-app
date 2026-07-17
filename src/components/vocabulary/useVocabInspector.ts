"use client";

import { useVocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import { useInspectorStore } from "@/stores/inspector-store";

export function useVocabInspector() {
 const openInspector = useInspectorStore((state) => state.openInspector);
 const closeInspector = useInspectorStore((state) => state.closeInspector);
 const isOpen = useInspectorStore((state) => state.isOpen);
 const openDetailDrawer = useVocabDetailDrawerStore((state) => state.openDetailDrawer);

 return { openInspector, closeInspector, isOpen, openDetailDrawer };
}
