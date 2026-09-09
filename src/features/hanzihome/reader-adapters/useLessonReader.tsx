"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
 analyzeContextualPronunciation,
 formatContextualSpokenPinyin,
} from "@/lib/pronunciation/contextual-pronunciation";
import { containsHanziText } from "../components/lesson-overview/hanzi-typography";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import type { ReaderDisplayAdapter } from "@/features/reader/model/reader-display";
import { useMandarinReaderSpeechService } from "@/features/speech/MandarinTtsProvider";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { useReaderSessionPronunciation } from "@/features/reading/hooks/useReaderSessionPronunciation";
import { useReadingSourceTarget } from "@/features/reading/hooks/useReadingSourceTarget";
import { useLessonAnnotationContext } from "../annotations/LessonAnnotationProvider";
import { useLearningState } from "../hooks/useLearningState";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "../components/lesson-overview/types";
import { LessonReaderTools } from "./LessonReaderTools";

export function useLessonReader({
 document,
 lessonId,
 annotationNodeType,
 displayMode: initialDisplayMode,
 menuContent,
 sheetContent,
}: {
 document: ReaderDocumentModel;
 lessonId?: string;
 annotationNodeType?: string;
 displayMode?: LessonDisplayMode;
 menuContent?: ReactNode;
 sheetContent?: ReactNode;
}) {
 const learning = useLearningState();
 const [localDisplay, setLocalDisplay] = useState(initialDisplayMode);
 const displayMode =
  localDisplay ?? learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const updateDisplay = (updates: Partial<LessonDisplayMode>) => {
  if (localDisplay) setLocalDisplay({ ...localDisplay, ...updates });
  else learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };
 const speech = useMandarinReaderSpeechService();
 const { openInspector } = useVocabInspector();
 const annotationContext = useLessonAnnotationContext();
 const pronunciation = useReaderSessionPronunciation(
  document.segments,
  displayMode.autoDetectPinyin,
 );
 const data = useMemo(
  () => ({
   ...document,
   titlePinyin:
    document.titlePinyin ||
    (displayMode.autoDetectPinyin && document.title && containsHanziText(document.title)
     ? formatContextualSpokenPinyin(analyzeContextualPronunciation({ text: document.title }))
     : undefined),
   segments: pronunciation.segments,
  }),
  [document, pronunciation.segments, displayMode.autoDetectPinyin],
 );
 const annotations = document.segments.flatMap((segment) =>
  lessonId && annotationContext
   ? annotationContext.getAnnotations(
      {
       lessonId,
       nodeId: segment.id,
       nodeType:
        annotationNodeType ?? (segment.kind === "paragraph" ? "text_paragraph" : "text_line"),
      },
      segment.zh,
     )
   : [],
 );
 const display: ReaderDisplayAdapter = { value: displayMode, onChange: updateDisplay };
 const services: ReaderServices = {
  speech,
  toolbar: { stickyOffset: "page" },
  pronunciationReview: pronunciation.service,
  renderReader: ({ content }) => (
   <LessonReaderContent>
    {content}
    {pronunciation.popover}
   </LessonReaderContent>
  ),
  renderTools: () => (
   <LessonReaderTools
    displayMode={displayMode}
    onDisplayModeChange={updateDisplay}
    menuContent={menuContent}
    sheetContent={sheetContent}
   />
  ),
  renderHanzi: ({ segment, content }) =>
   lessonId && annotationContext ? (
    <div
     data-study-annotation-node
     data-lesson-id={lessonId}
     data-node-id={segment.id}
     data-node-type={
      annotationNodeType ?? (segment.kind === "paragraph" ? "text_paragraph" : "text_line")
     }
    >
     {content}
    </div>
   ) : (
    content
   ),
  lookup:
   lessonId && annotationContext
    ? undefined
    : (selection) => {
       void openInspector(selection.text, { anchorRect: selection.rect });
      },
  annotations:
   lessonId && annotationContext
    ? {
       items: annotations
        .filter((annotation) => !annotation.stale)
        .map((annotation) => ({
         id: annotation.id,
         segmentId: annotation.nodeId,
         text: annotation.selectedText,
         start: annotation.resolvedStartOffset,
         end: annotation.resolvedEndOffset,
        })),
       onOpen: (annotation) => {
        const source = annotations.find((item) => item.id === annotation.id);
        if (source) annotationContext.openAnnotation(source);
       },
       // LessonAnnotationProvider owns selection capture and the existing save menu.
       onSelection: () => {},
      }
    : undefined,
 };
 return { data, display, displayMode, services };
}

function LessonReaderContent({ children }: { children: ReactNode }) {
 useReadingSourceTarget(true);
 return children;
}
