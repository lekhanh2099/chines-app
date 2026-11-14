"use client";

import { useMemo, useState } from "react";
import { buildBusinessChineseReaderDocument } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 useReaderCommands,
 useReaderServices,
 useReaderStore,
} from "@/features/reader/runtime/reader-context";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import type { BusinessChineseAnnotationsContextValue } from "./business-chinese-annotations-context";
import {
 businessChinesePronunciationAnalyses,
 businessChineseReaderAnnotations,
 businessChineseReaderVocabulary,
} from "./business-chinese-study-utils";
import { useBusinessChineseReaderAnnotations } from "./useBusinessChineseReaderAnnotations";

/**
 * Wires the lesson text document to personal reader annotations and the
 * selection popover, and exposes the reader services/context values that make
 * annotations available to every section reader and lesson text block.
 */
export function useBusinessChineseAnnotationServices(lesson: TextbookLesson) {
 const textReaderDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, "text"),
  [lesson],
 );
 const [annotationError, setAnnotationError] = useState("");
 const annotationsQuery = useBusinessChineseReaderAnnotations(textReaderDocument.id);
 const readerVocabulary = useMemo(
  () => businessChineseReaderVocabulary(lesson.vocab),
  [lesson.vocab],
 );
 const analysisBySegmentId = useMemo(
  () => businessChinesePronunciationAnalyses(textReaderDocument),
  [textReaderDocument],
 );
 const readerCommands = useReaderCommands();
 const { actions: readerActions } = useReaderStore();
 const parentServices = useReaderServices();
 const {
  handleOpenAnnotation,
  handleSelection,
  popover: selectionPopover,
 } = useReaderSelectionActions({
  selectSegment: readerActions.selectSegment,
  stop: readerCommands.stop,
  playFromCharacter: readerCommands.playFromCharacter,
  document: textReaderDocument,
  vocabulary: readerVocabulary,
  stateOwner: "personal",
  analysisBySegmentId,
  setSaveError: setAnnotationError,
 });

 const annotationServices: ReaderServices = useMemo(
  () => ({
   annotations: {
    items: businessChineseReaderAnnotations(annotationsQuery.data ?? []),
    onOpen: (annotation, rect) => {
     const source = annotationsQuery.data?.find((item) => item.id === annotation.id);
     if (source) handleOpenAnnotation(source, rect);
    },
    onSelection: (target) => {
     const index = textReaderDocument.segments.findIndex(
      (segment) => segment.id === target.segmentId,
     );
     const segment = textReaderDocument.segments[index];
     if (segment) handleSelection({ ...target, segment, index });
    },
   },
  }),
  [annotationsQuery.data, handleOpenAnnotation, handleSelection, textReaderDocument],
 );

 const annotationsContextValue = useMemo<BusinessChineseAnnotationsContextValue>(
  () => ({
   readerAnnotations: annotationsQuery.data ?? [],
   onOpenReaderAnnotation: handleOpenAnnotation,
  }),
  [annotationsQuery.data, handleOpenAnnotation],
 );
 const readerServicesValue = useMemo<ReaderServices>(
  () => ({ ...parentServices, ...annotationServices }),
  [parentServices, annotationServices],
 );

 return {
  textReaderDocument,
  annotationError,
  annotationsError: annotationsQuery.error,
  selectionPopover,
  annotationServices,
  annotationsContextValue,
  readerServicesValue,
 };
}
