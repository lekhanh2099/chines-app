"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
 BookmarkPlus,
 Highlighter,
 Info,
 Languages,
 Play,
 StickyNote,
 Volume2,
 X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { PinyinText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { formatContextualPinyinRange } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { ReaderSurfaceSelection } from "@/features/reading/model/reading-interactions";
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

type SelectionMode = "quick" | "note";

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
 const t = useTranslations("Reader.study.chrome.selection");
 const notesT = useTranslations("Reader.study.chrome.notes");
 const queryClient = useQueryClient();
 const tts = useSharedMandarinTts();
 const { openInspector } = useVocabInspector();
 const [selection, setSelection] = useState<ReaderSurfaceSelection | null>(null);
 const [mode, setMode] = useState<SelectionMode>("quick");
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
 const handleSelection = useCallback(
  (next: ReaderSurfaceSelection) => {
   selectSegment(next.segment.id, "scroll");
   setSelection(next);
   setMode("quick");
   setNoteDraft("");
   setOpenedAnnotation(undefined);
  },
  [selectSegment],
 );
 const handleOpenAnnotation = (annotation: ReaderAnnotationRow, rect: DOMRect) => {
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
  setNoteDraft(annotation.note_text);
  setMode("note");
 };
 const invalidateAnnotations = () =>
  queryClient.invalidateQueries({
   queryKey:
    stateOwner === "reader"
     ? hanzihomeQueryKeys.readerState(documentModel.id)
     : hanzihomeQueryKeys.readerAnnotations(documentModel.id),
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
 const saveAnnotation = (annotationType: "highlight" | "note") => {
  if (saving || !selection || selection.start === null || selection.end === null) return;
  setSaving(true);
  setSaveError("");
  const request = openedAnnotation
   ? updateReaderAnnotation(openedAnnotation, noteDraft)
   : createReaderAnnotation({
      documentId: documentModel.id,
      paragraphId: selection.segment.id,
      assetId: null,
      annotationType,
      pageNumber: null,
      startOffset: selection.start,
      endOffset: selection.end,
      selectedText: selection.text,
      noteText: annotationType === "note" ? noteDraft : "",
      color: annotationType === "note" ? "yellow" : "green",
      payload: {},
     });
  void request
   .then((savedAnnotation) => {
    queryClient.setQueriesData<readonly ReaderAnnotationRow[]>(
     { queryKey: ["hanzihome", "reader", "annotations"] },
     (current) => {
      if (!current) return [savedAnnotation];
      const exists = current.some((item) => item.id === savedAnnotation.id);
      return exists
       ? current.map((item) => (item.id === savedAnnotation.id ? savedAnnotation : item))
       : [...current, savedAnnotation];
     },
    );
    queryClient.setQueriesData<ReaderStateBootstrap | null>(
     { queryKey: ["hanzihome", "reader", "state"] },
     (current) => {
      if (!current) return current;
      const exists = current.annotations.some((item) => item.id === savedAnnotation.id);
      return {
       ...current,
       annotations: exists
        ? current.annotations.map((item) =>
           item.id === savedAnnotation.id ? savedAnnotation : item,
          )
        : [...current.annotations, savedAnnotation],
      };
     },
    );
    if (annotationType === "highlight") {
     const now = new Date().toISOString();
     void upsertLearningLoopItem({
      id: `reader-bookmark:${documentModel.id}:${selection.segment.id}:${selection.start}`,
      stable_key: `reader-bookmark:${documentModel.id}:${selection.segment.id}:${selection.start}`,
      kind: "reading_bookmark",
      source_id: documentModel.id,
      source_href: sourceHref(selection, "reader-highlight"),
      title_zh: documentModel.title ?? "",
      title_vi: documentModel.titleVi ?? "",
      prompt_zh: selection.text,
      pinyin: "",
      meaning_vi: "",
      user_answer: "",
      error_key: "",
      state: "new",
      due_at: now,
      interval_days: 0,
      correct_streak: 0,
      lapse_count: 0,
      revision: 0,
     }).catch((reviewError: Error) => setSaveError(reviewError.message));
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
  void deleteReaderAnnotation(annotationId, revision, documentModel.id)
   .then(() => {
    queryClient.setQueriesData<readonly ReaderAnnotationRow[]>(
     { queryKey: ["hanzihome", "reader", "annotations"] },
     (current) => (current ? current.filter((item) => item.id !== annotationId) : []),
    );
    queryClient.setQueriesData<ReaderStateBootstrap | null>(
     { queryKey: ["hanzihome", "reader", "state"] },
     (current) =>
      current
       ? {
          ...current,
          annotations: current.annotations.filter((item) => item.id !== annotationId),
         }
       : current,
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
  void upsertLearningLoopItem({
   id: `reader-selection:${documentModel.id}:${selection.segment.id}:${selection.start}`,
   stable_key: `reader-selection:${documentModel.id}:${selection.segment.id}:${selection.start}`,
   kind: vocabulary === undefined ? "reading_bookmark" : "vocabulary",
   source_id: documentModel.id,
   source_href: sourceHref(selection, "reader-selection"),
   title_zh: documentModel.title ?? "",
   title_vi: documentModel.titleVi ?? "",
   prompt_zh: selection.text,
   pinyin: vocabulary?.pinyin || selectedPinyin,
   meaning_vi: vocabulary?.meaning || "",
   user_answer: "",
   error_key: "",
   state: "new",
   due_at: now,
   interval_days: 0,
   correct_streak: 0,
   lapse_count: 0,
   revision: 0,
  })
   .then(() => setSaveError(""))
   .catch((reviewError: Error) => setSaveError(reviewError.message));
  clear();
 };
 const anchor = useCallback(
  () =>
   selection
    ? { getBoundingClientRect: () => selection.rect, contextElement: document.body }
    : null,
  [selection],
 );

 const popover = (
  <Popover.Root
   open={!!selection}
   modal={false}
   onOpenChange={(open, details) => {
    if (open) return;
    const target = details.event.target;
    // The click ending a text selection (or opening a saved mark) is its anchor,
    // not an outside click dismissing the menu that just opened on mouseup.
    if (
     details.reason === "outside-press" &&
     ["click", "pointerdown", "mousedown", "touchstart"].includes(details.event.type) &&
     target instanceof Element &&
     target.closest("[data-reader-hanzi-content], [data-reader-source]") &&
     (window.getSelection()?.isCollapsed === false || target.closest(".reading-highlight"))
    )
     return;
    clear();
   }}
  >
   {selection ? (
    <Popover.Portal>
     <BasePopoverPositioner
      anchor={anchor}
      side="top"
      align="center"
      sideOffset={10}
      collisionPadding={8}
      positionMethod="fixed"
     >
      <BasePopoverPopup
       variant="lookup"
       initialFocus={false}
       finalFocus={false}
       data-no-inspector
       onMouseDown={(event) => {
        if (event.target instanceof Element && event.target.closest("textarea, input")) return;
        event.preventDefault();
       }}
      >
       <div className="grid gap-3 p-3">
        <div className="flex items-start justify-between gap-2">
         <div className="grid min-w-0 gap-0.5">
          <Typography as="strong" variant="cardTitle" lang="zh-CN" clamp="one">
           {selection.text}
          </Typography>
          <PinyinText variant="caption" tone="muted">
           {selectedPinyin || t("missingPinyin")}
          </PinyinText>
         </div>
         <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={t("closeAria")}
          onClick={clear}
         >
          <X aria-hidden="true" />
         </Button>
        </div>
        {mode === "quick" ? (
         <>
          <Typography variant="bodySmall" tone="muted">
           {vocabulary?.meaning || t("missingMeaning")}
          </Typography>
          <div className="grid grid-cols-3 gap-1" role="toolbar" aria-label={t("actionsAria")}>
           <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
             openInspector(selection.text, { anchorRect: selection.rect });
             clear();
            }}
           >
            <Languages data-icon="inline-start" />
            {t("lookup")}
           </Button>
           <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving || selection.start === null || selection.end === null}
            onClick={() => saveAnnotation("highlight")}
           >
            <Highlighter data-icon="inline-start" />
            {t("highlight")}
           </Button>
           <Button type="button" size="sm" variant="ghost" onClick={() => setMode("note")}>
            <StickyNote data-icon="inline-start" />
            {t("note")}
           </Button>
          </div>
         </>
        ) : (
         <>
          <Textarea
           value={noteDraft}
           onChange={(event) => setNoteDraft(event.target.value)}
           placeholder={t("notePlaceholder")}
           aria-label={t("noteAria")}
           rows={2}
          />
          <div className="flex justify-end gap-2">
           {openedAnnotation ? (
            <Button
             type="button"
             size="sm"
             variant="ghost"
             disabled={saving}
             onClick={() => removeAnnotation(openedAnnotation.id, openedAnnotation.revision)}
            >
             {notesT("delete")}
            </Button>
           ) : null}
           <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => (openedAnnotation ? clear() : setMode("quick"))}
           >
            {t("cancel")}
           </Button>
           <Button
            type="button"
            size="sm"
            disabled={
             saving || !noteDraft.trim() || selection.start === null || selection.end === null
            }
            onClick={() => saveAnnotation("note")}
           >
            {t("saveNote")}
           </Button>
          </div>
         </>
        )}
        <div className="flex flex-wrap gap-1 border-t border-border-default pt-2">
         <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
           stop();
           tts.speakSequence([selection.text]);
          }}
         >
          <Volume2 data-icon="inline-start" />
          {t("listen")}
         </Button>
         {playFromCharacter && selection.start !== null ? (
          <Button
           type="button"
           size="sm"
           variant="ghost"
           onClick={() => {
            stop();
            selectSegment(selection.segment.id, "scroll");
            playFromCharacter(selection.segment.id, selection.start ?? 0);
            clear();
           }}
          >
           <Play data-icon="inline-start" />
           {t("playFromHere")}
          </Button>
         ) : null}
         <Button type="button" size="sm" variant="ghost" onClick={addToReview}>
          <BookmarkPlus data-icon="inline-start" />
          {t("review")}
         </Button>
         <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
           openInspector(selection.text, { anchorRect: selection.rect });
           clear();
          }}
         >
          <Info data-icon="inline-start" />
          {t("understand")}
         </Button>
        </div>
       </div>
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </Popover.Portal>
   ) : null}
  </Popover.Root>
 );

 return { handleSelection, handleOpenAnnotation, popover, removeAnnotation };
}
