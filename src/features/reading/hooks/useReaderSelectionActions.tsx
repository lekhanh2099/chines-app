"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { formatContextualPinyinRange } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 ReaderSelectionPopoverContent,
 ReaderSelectionPopoverRoot,
} from "@/features/reading/components/ReaderSelectionPopoverContent";
import type { ReaderSurfaceSelection } from "@/features/reading/model/reading-interactions";
import {
 buildReaderSelectionLoopItem,
 removeById,
 upsertById,
 type HighlightColor,
 type ReaderSelectionMode,
} from "@/features/reading/model/reader-selection-model";
import {
 createReaderAnnotation,
 deleteReaderAnnotation,
 updateReaderAnnotation,
} from "@/features/reading/services/reading-annotation-api";
import type { ReaderStateBootstrap } from "@/features/reading/services/reading-state-api";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import { buildReaderSourceHref } from "@/features/reading/model/reading-source-target";
import type { ReaderStore } from "@/features/reader/runtime/reader-store";
import type { ReaderCommands } from "@/features/reader/runtime/reader-playback";
import type {
 ReaderProgressOwner,
 ReaderPronunciationAnalysis,
} from "@/features/reading/hooks/useReaderStudyState";

export {
 HIGHLIGHT_COLORS,
 type HighlightColor,
} from "@/features/reading/model/reader-selection-model";

export function useReaderSelectionActions({
 document: documentModel,
 vocabulary: documentVocabulary,
 stateOwner,
 analysisBySegmentId,
 setSaveError,
 selectSegment,
 stop,
 playFromCharacter,
}: {
 document: ReaderDocumentModel;
 vocabulary: ReaderDocumentResource["vocabulary"];
 stateOwner: ReaderProgressOwner;
 analysisBySegmentId: ReadonlyMap<string, ReaderPronunciationAnalysis>;
 setSaveError: (error: string) => void;
 selectSegment: ReaderStore["actions"]["selectSegment"];
 stop: ReaderCommands["stop"];
 playFromCharacter?: ReaderCommands["playFromCharacter"];
}) {
 const queryClient = useQueryClient();
 const tts = useSharedMandarinTts();
 const { openInspector } = useVocabInspector();
 const { userId } = useClientSession();
 const [selection, setSelection] = useState<ReaderSurfaceSelection | null>(null);
 const [mode, setMode] = useState<ReaderSelectionMode>("quick");
 const [selectedColor, setSelectedColor] = useState<HighlightColor>("yellow");
 const [noteDraft, setNoteDraft] = useState("");
 const [openedAnnotation, setOpenedAnnotation] = useState<ReaderAnnotationRow>();
 const [saving, setSaving] = useState(false);
 const analysis = selection ? analysisBySegmentId.get(selection.segment.id) : undefined;
 const vocabulary = selection
  ? documentVocabulary.find((item) => item.word === selection.text)
  : undefined;
 const selectedPinyin =
  selection && analysis && selection.start !== null && selection.end !== null
   ? formatContextualPinyinRange(analysis, selection.start, selection.end)
   : "";

 const clear = useCallback(() => {
  setSelection(null);
  setMode("quick");
  setNoteDraft("");
  setOpenedAnnotation(undefined);
  window.getSelection()?.removeAllRanges();
 }, []);
 const handleSelection = useCallback((next: ReaderSurfaceSelection) => {
  setSelection(next);
  setMode("quick");
  setNoteDraft("");
  setOpenedAnnotation(undefined);
 }, []);
 const handleOpenAnnotation = useCallback(
  (annotation: ReaderAnnotationRow, rect: DOMRect) => {
   const index = documentModel.segments.findIndex(
    (segment) => segment.id === annotation.paragraph_id,
   );
   const segment = documentModel.segments[index];
   if (!segment) return;
   setSelection({
    segment,
    index,
    text: annotation.selected_text,
    start: annotation.start_offset,
    end: annotation.end_offset,
    rect,
   });
   setOpenedAnnotation(annotation);
   setSelectedColor(annotation.color);
   setNoteDraft(annotation.note_text);
   setMode(annotation.annotation_type === "note" ? "note" : "quick");
  },
  [documentModel.segments],
 );
 // Annotation caches are owned per (owner, document); prefix keys would write
 // this document's annotation into every other cached Reader document.
 const annotationsQueryKey = hanzihomeQueryKeys.readerAnnotations(userId, documentModel.id);
 const readerStateQueryKey = hanzihomeQueryKeys.readerState(userId, documentModel.id);
 const invalidateAnnotations = () =>
  queryClient.invalidateQueries({
   queryKey: stateOwner === "reader" ? readerStateQueryKey : annotationsQueryKey,
  });
 const sourceHref = (
  current: ReaderSurfaceSelection,
  source: "reader-selection" | "reader-highlight",
 ) =>
  buildReaderSourceHref(
   {
    source,
    documentId: documentModel.id,
    paragraphId: current.segment.id,
    ...(current.start !== null && current.end !== null
     ? { startOffset: current.start, endOffset: current.end }
     : {}),
   },
   documentModel.source.href,
  );
 const saveAnnotation = (
  annotationType: ReaderAnnotationRow["annotation_type"],
  color?: HighlightColor,
 ) => {
  if (saving || !selection || selection.start === null || selection.end === null) return;
  if (!userId) {
   setSaveError("Vui lòng đăng nhập để lưu ghi chú/đánh dấu.");
   return;
  }
  const resolvedColor = color ?? selectedColor ?? (annotationType === "note" ? "yellow" : "green");
  setSelectedColor(resolvedColor);
  setSaving(true);
  setSaveError("");
  const request = openedAnnotation
   ? updateReaderAnnotation(openedAnnotation, noteDraft, userId, resolvedColor)
   : createReaderAnnotation(
      {
       documentId: documentModel.id,
       paragraphId: selection.segment.id,
       assetId: null,
       annotationType,
       pageNumber: null,
       startOffset: selection.start,
       endOffset: selection.end,
       selectedText: selection.text,
       noteText: annotationType === "note" ? noteDraft : "",
       color: resolvedColor,
       payload: {},
      },
      userId,
     );
  void request
   .then((savedAnnotation) => {
    queryClient.setQueryData<readonly ReaderAnnotationRow[]>(annotationsQueryKey, (current) =>
     current ? upsertById(current, savedAnnotation) : [savedAnnotation],
    );
    queryClient.setQueryData<ReaderStateBootstrap | null>(readerStateQueryKey, (current) =>
     current
      ? { ...current, annotations: upsertById(current.annotations, savedAnnotation) }
      : current,
    );
    if (annotationType === "highlight") {
     const now = new Date().toISOString();
     void upsertLearningLoopItem(
      buildReaderSelectionLoopItem({
       stableKey: `reader-bookmark:${documentModel.id}:${selection.segment.id}:${selection.start}`,
       kind: "reading_bookmark",
       documentModel,
       sourceHref: sourceHref(selection, "reader-highlight"),
       promptZh: selection.text,
       pinyin: "",
       meaningVi: "",
       now,
      }),
     ).catch((reviewError: Error) => setSaveError(reviewError.message));
    }
    clear();
    return invalidateAnnotations();
   })
   .catch((annotationError: Error) => setSaveError(annotationError.message))
   .finally(() => setSaving(false));
 };
 const removeAnnotation = (annotationId: string, revision: number) => {
  if (saving) return;
  setSaving(true);
  setSaveError("");
  void deleteReaderAnnotation(annotationId, revision, documentModel.id, userId ?? undefined)
   .then(() => {
    queryClient.setQueryData<readonly ReaderAnnotationRow[]>(annotationsQueryKey, (current) =>
     current ? removeById(current, annotationId) : current,
    );
    queryClient.setQueryData<ReaderStateBootstrap | null>(readerStateQueryKey, (current) =>
     current ? { ...current, annotations: removeById(current.annotations, annotationId) } : current,
    );
    clear();
    return invalidateAnnotations();
   })
   .catch((annotationError: Error) => setSaveError(annotationError.message))
   .finally(() => setSaving(false));
 };
 const addToReview = () => {
  if (!selection || selection.start === null) return;
  const now = new Date().toISOString();
  void upsertLearningLoopItem(
   buildReaderSelectionLoopItem({
    stableKey: `reader-selection:${documentModel.id}:${selection.segment.id}:${selection.start}`,
    kind: vocabulary === undefined ? "reading_bookmark" : "vocabulary",
    documentModel,
    sourceHref: sourceHref(selection, "reader-selection"),
    promptZh: selection.text,
    pinyin: vocabulary?.pinyin || selectedPinyin,
    meaningVi: vocabulary?.meaning || "",
    now,
   }),
  )
   .then(() => setSaveError(""))
   .catch((reviewError: Error) => setSaveError(reviewError.message));
  clear();
 };
 const lookup = (current: ReaderSurfaceSelection) => {
  openInspector(current.text, { anchorRect: current.rect });
  clear();
 };
 const listen = (current: ReaderSurfaceSelection) => {
  stop();
  tts.speakSequence([current.text]);
 };
 const playFromHere = playFromCharacter
  ? (current: ReaderSurfaceSelection) => {
     stop();
     selectSegment(current.segment.id, "scroll");
     playFromCharacter(current.segment.id, current.start ?? 0);
     clear();
    }
  : undefined;

 const popover = (
  <ReaderSelectionPopoverRoot open={!!selection} onDismiss={clear}>
   {selection ? (
    <ReaderSelectionPopoverContent
     selection={selection}
     mode={mode}
     selectedColor={selectedColor}
     noteDraft={noteDraft}
     openedAnnotation={openedAnnotation}
     saving={saving}
     onModeChange={setMode}
     onSelectedColorChange={setSelectedColor}
     onNoteDraftChange={setNoteDraft}
     onClear={clear}
     onSaveAnnotation={saveAnnotation}
     onRemoveAnnotation={removeAnnotation}
     onAddToReview={addToReview}
     onLookup={lookup}
     onListen={listen}
     onPlayFromHere={playFromHere}
    />
   ) : null}
  </ReaderSelectionPopoverRoot>
 );

 return { handleSelection, handleOpenAnnotation, popover, removeAnnotation };
}
