"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import { CompactSectionNavigation } from "./BusinessChineseSectionNavigation";
import { businessChineseSectionDocuments } from "./business-chinese-study-utils";

/**
 * Splits the lesson text document per section and builds the reader services for
 * the first text-section reader (which carries the toolbar) and the others.
 */
export function useBusinessChineseSectionReaderServices({
 textReaderDocument,
 annotationServices,
 visibleSections,
 onSelectSection,
 focusMode,
 toolbarNavMenu,
}: {
 textReaderDocument: ReaderDocumentModel;
 annotationServices: ReaderServices;
 visibleSections: TextbookLesson["sections"];
 onSelectSection: (sectionId: string) => void;
 focusMode: boolean;
 toolbarNavMenu: ReactNode;
}) {
 const sectionDocuments = useMemo(
  () => businessChineseSectionDocuments(textReaderDocument),
  [textReaderDocument],
 );

 const renderReaderSection = useCallback(
  ({ section: readerSection, content }: { section: { id: string }; content: ReactNode }) => (
   <div id={readerSection.id}>{content}</div>
  ),
  [],
 );

 const firstSectionServices = useMemo<ReaderServices>(
  () => ({
   ...annotationServices,
   toolbar: {
    hidePinyinToggle: true,
    hideTranslationToggle: true,
    leadingActions:
     visibleSections.length > 1 ? (
      <CompactSectionNavigation
       sections={visibleSections}
       onSelect={onSelectSection}
       className={!focusMode ? "2xl:hidden" : undefined}
      />
     ) : undefined,
    actions: toolbarNavMenu,
   },
   renderSection: renderReaderSection,
  }),
  [
   annotationServices,
   visibleSections,
   onSelectSection,
   focusMode,
   toolbarNavMenu,
   renderReaderSection,
  ],
 );

 const otherSectionServices = useMemo<ReaderServices>(
  () => ({
   ...annotationServices,
   renderSection: renderReaderSection,
  }),
  [annotationServices, renderReaderSection],
 );

 return { sectionDocuments, firstSectionServices, otherSectionServices };
}
