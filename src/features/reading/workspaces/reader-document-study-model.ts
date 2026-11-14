import type { LucideIcon } from "lucide-react";

import type { ReaderAnnotation as ReaderSurfaceAnnotation } from "@/features/reader/runtime/reader-services";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { useReaderStudyState } from "@/features/reading/hooks/useReaderStudyState";

export type ReaderWorkspaceTab =
 | "reader"
 | "overview"
 | "exercises"
 | "vocabulary"
 | "translation"
 | "dictation"
 | "analysis"
 | "summary"
 | "notes";

export type ReaderWorkspaceTabItem = { id: ReaderWorkspaceTab; label: string; icon: LucideIcon };

type ReaderStudyAnnotations = ReturnType<typeof useReaderStudyState>["annotations"];

export function metadataString(resource: ReaderDocumentResource, key: string) {
 const value = resource.document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

/** Paragraphs with both Chinese and Vietnamese text, numbered for translation practice. */
export function buildReaderTranslationSegments(paragraphs: ReaderDocumentResource["paragraphs"]) {
 return paragraphs
  .filter((paragraph) => paragraph.zh.trim().length > 0 && paragraph.vi.trim().length > 0)
  .map((paragraph, index) => ({
   id: paragraph.id,
   order: index + 1,
   sourceLabel: "Bài đọc",
   zh: paragraph.zh,
   pinyin: paragraph.pinyin,
   vi: paragraph.vi,
  }));
}

/** Splits the available tabs into the reading/practice/resource groups and resolves the active group. */
export function groupReaderWorkspaceTabs(
 availableTabs: ReadonlyArray<ReaderWorkspaceTabItem>,
 activeWorkspaceTab: ReaderWorkspaceTab,
) {
 const readingTabs = availableTabs.filter(
  (tab) => tab.id === "reader" || tab.id === "analysis" || tab.id === "summary",
 );
 const practiceTabs = availableTabs.filter(
  (tab) => tab.id === "exercises" || tab.id === "translation" || tab.id === "dictation",
 );
 const resourceTabs = availableTabs.filter(
  (tab) => tab.id === "vocabulary" || tab.id === "notes" || tab.id === "overview",
 );
 const activeGroup: ReaderWorkspaceTab = readingTabs.some((tab) => tab.id === activeWorkspaceTab)
  ? "reader"
  : practiceTabs.some((tab) => tab.id === activeWorkspaceTab)
    ? "exercises"
    : "vocabulary";
 const activeGroupTabs =
  activeGroup === "reader"
   ? readingTabs
   : activeGroup === "exercises"
     ? practiceTabs
     : resourceTabs;
 return { readingTabs, practiceTabs, resourceTabs, activeGroup, activeGroupTabs };
}

/** Saved Reader annotations that carry a valid in-paragraph range, as Reader surface marks. */
export function readerSurfaceAnnotations(
 annotations: ReaderStudyAnnotations,
): ReaderSurfaceAnnotation[] {
 return annotations.flatMap((annotation) =>
  annotation.paragraph_id !== null &&
  annotation.start_offset !== null &&
  annotation.end_offset !== null &&
  annotation.end_offset > annotation.start_offset &&
  annotation.selected_text.length > 0
   ? [
      {
       id: annotation.id,
       segmentId: annotation.paragraph_id,
       text: annotation.selected_text,
       noteText: annotation.note_text,
       start: annotation.start_offset,
       end: annotation.end_offset,
       color: annotation.color,
      },
     ]
   : [],
 );
}
