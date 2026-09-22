"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
 BookmarkPlus,
 ChevronLeft,
 Info,
 Languages,
 MoreHorizontal,
 Play,
 StickyNote,
 Trash2,
 Volume2,
 X,
} from "lucide-react";
import { useCallback, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";

import { useClientSession } from "@/components/providers/QueryProvider";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
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

type SelectionMode = "quick" | "note" | "more";
export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export const HIGHLIGHT_COLORS: ReadonlyArray<{
 color: HighlightColor;
 label: string;
 swatchStyle: CSSProperties;
}> = [
 {
  color: "yellow",
  label: "Vàng",
  swatchStyle: { backgroundColor: "var(--color-warning)" },
 },
 {
  color: "green",
  label: "Xanh lá",
  swatchStyle: { backgroundColor: "var(--color-success)" },
 },
 {
  color: "blue",
  label: "Xanh biển",
  swatchStyle: { backgroundColor: "var(--color-info)" },
 },
 {
  color: "pink",
  label: "Hồng",
  swatchStyle: { backgroundColor: "var(--color-purple)" },
 },
];

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
 const { userId } = useClientSession();
 const [selection, setSelection] = useState<ReaderSurfaceSelection | null>(null);
 const [mode, setMode] = useState<SelectionMode>("quick");
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
  setSelectedColor(annotation.color);
  setNoteDraft(annotation.note_text);
  setMode(annotation.annotation_type === "note" ? "note" : "quick");
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
  void deleteReaderAnnotation(annotationId, revision, documentModel.id, userId ?? undefined)
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
       variant={mode === "quick" ? "actions" : "lookup"}
       initialFocus={false}
       finalFocus={false}
       data-no-inspector
       onMouseDown={(event) => {
        if (event.target instanceof Element && event.target.closest("textarea, input")) return;
        event.preventDefault();
       }}
      >
       {mode === "quick" ? (
        <div className="flex items-center gap-1">
         {/* Nhóm 4 chấm màu tròn pastel */}
         <div className="flex items-center gap-1.5 px-1" role="group" aria-label="Tô màu">
          {HIGHLIGHT_COLORS.map(({ color, label, swatchStyle }) => {
           const isCurrent = openedAnnotation
            ? openedAnnotation.color === color
            : selectedColor === color;
           return (
            <Button
             key={color}
             type="button"
             variant="swatch"
             size="icon-xs"
             style={swatchStyle}
             aria-pressed={isCurrent}
             aria-label={`Màu ${label}`}
             title={`Tô màu ${label}`}
             disabled={saving}
             onClick={() => {
              setSelectedColor(color);
              if (openedAnnotation) {
               saveAnnotation(openedAnnotation.annotation_type, color);
              } else {
               saveAnnotation("highlight", color);
              }
             }}
            >
             <span className="sr-only">{label}</span>
            </Button>
           );
          })}
         </div>

         <div className="h-4 w-px bg-border-default/80" />

         {/* Nút Ghi chú */}
         <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          title={t("note")}
          aria-label={t("note")}
          onClick={() => setMode("note")}
         >
          <StickyNote className="size-3.5" />
         </Button>

         {/* Nút Tra từ */}
         <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          title={t("lookup")}
          aria-label={t("lookup")}
          onClick={() => {
           openInspector(selection.text, { anchorRect: selection.rect });
           clear();
          }}
         >
          <Languages className="size-3.5" />
         </Button>

         {/* Nút Nghe phát âm */}
         <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          title={t("listen")}
          aria-label={t("listen")}
          onClick={() => {
           stop();
           tts.speakSequence([selection.text]);
          }}
         >
          <Volume2 className="size-3.5" />
         </Button>

         {/* Nút Xóa nhanh nếu là annotation có sẵn */}
         {openedAnnotation ? (
          <Button
           type="button"
           size="icon-xs"
           variant="destructive"
           title={notesT("delete")}
           aria-label={notesT("delete")}
           disabled={saving}
           onClick={() => removeAnnotation(openedAnnotation.id, openedAnnotation.revision)}
          >
           <Trash2 className="size-3.5" />
          </Button>
         ) : null}

         {/* Nút Thao tác khác (...) */}
         <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          title="Thao tác khác"
          aria-label="Thao tác khác"
          onClick={() => setMode("more")}
         >
          <MoreHorizontal className="size-3.5" />
         </Button>

         {/* Nút Đóng */}
         <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          title={t("closeAria")}
          aria-label={t("closeAria")}
          onClick={clear}
         >
          <X className="size-3.5" />
         </Button>
        </div>
       ) : mode === "more" ? (
        <div className="grid gap-2 p-2.5 w-60">
         <div className="flex items-center justify-between gap-1 pb-1 border-b border-border-default">
          <div className="flex items-center gap-1 min-w-0">
           <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            title="Trở lại"
            aria-label="Trở lại"
            onClick={() => setMode("quick")}
           >
            <ChevronLeft className="size-3.5" />
           </Button>
           <Typography as="span" variant="bodySmall" weight="bold" clamp="one">
            {selection.text}
           </Typography>
          </div>
          <Button
           type="button"
           size="icon-xs"
           variant="ghost"
           aria-label={t("closeAria")}
           onClick={clear}
          >
           <X className="size-3.5" />
          </Button>
         </div>

         <div className="grid gap-0.5">
          {playFromCharacter && selection.start !== null ? (
           <Button
            type="button"
            size="sm"
            variant="ghost"
            align="start"
            onClick={() => {
             stop();
             selectSegment(selection.segment.id, "scroll");
             playFromCharacter(selection.segment.id, selection.start ?? 0);
             clear();
            }}
           >
            <Play className="size-3.5" />
            {t("playFromHere")}
           </Button>
          ) : null}

          <Button type="button" size="sm" variant="ghost" align="start" onClick={addToReview}>
           <BookmarkPlus className="size-3.5" />
           {t("review")}
          </Button>

          <Button
           type="button"
           size="sm"
           variant="ghost"
           align="start"
           onClick={() => {
            openInspector(selection.text, { anchorRect: selection.rect });
            clear();
           }}
          >
           <Info className="size-3.5" />
           {t("understand")}
          </Button>

          {openedAnnotation ? (
           <Button
            type="button"
            size="sm"
            variant="menuDestructive"
            align="start"
            disabled={saving}
            onClick={() => removeAnnotation(openedAnnotation.id, openedAnnotation.revision)}
           >
            <Trash2 className="size-3.5" />
            {notesT("delete")}
           </Button>
          ) : null}
         </div>
        </div>
       ) : (
        <div className="grid gap-2.5 p-3 w-72">
         <div className="flex items-center justify-between gap-1 pb-1">
          <div className="flex items-center gap-1.5" role="group" aria-label="Màu ghi chú">
           {HIGHLIGHT_COLORS.map(({ color, label, swatchStyle }) => {
            const isCurrent = openedAnnotation
             ? openedAnnotation.color === color
             : selectedColor === color;
            return (
             <Button
              key={color}
              type="button"
              variant="swatch"
              size="icon-xs"
              style={swatchStyle}
              aria-pressed={isCurrent}
              aria-label={`Màu ${label}`}
              title={`Màu ${label}`}
              disabled={saving}
              onClick={() => {
               setSelectedColor(color);
               if (openedAnnotation) {
                saveAnnotation(openedAnnotation.annotation_type, color);
               }
              }}
             >
              <span className="sr-only">{label}</span>
             </Button>
            );
           })}
          </div>
          <Button
           type="button"
           size="icon-xs"
           variant="ghost"
           aria-label={t("closeAria")}
           onClick={() => (openedAnnotation ? clear() : setMode("quick"))}
          >
           <X className="size-3.5" />
          </Button>
         </div>
         <Textarea
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder={t("notePlaceholder")}
          aria-label={t("noteAria")}
          rows={2}
          autoFocus
         />
         <div className="flex justify-end gap-1.5 pt-1">
          {openedAnnotation ? (
           <Button
            type="button"
            size="sm"
            variant="destructive"
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
           onClick={() => saveAnnotation("note", selectedColor)}
          >
           {t("saveNote")}
          </Button>
         </div>
        </div>
       )}
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </Popover.Portal>
   ) : null}
  </Popover.Root>
 );

 return { handleSelection, handleOpenAnnotation, popover, removeAnnotation };
}
