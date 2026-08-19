"use client";

import { useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Highlighter, Info, Languages, StickyNote, Volume2, X } from "lucide-react";
import { useCallback, useState } from "react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import { PinyinText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { formatContextualPinyinRange } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { hanzihomeQueryKeys } from "../../query-keys";
import type { ReaderSurfaceSelection } from "../components/ReaderSurface";
import {
 createReaderAnnotation,
 deleteReaderAnnotation,
} from "../reader-annotation-api";
import type { ReaderDocumentResource } from "../reader-content-api";
import {
 useReaderRuntimeActions,
 useReaderRuntimeCommands,
} from "../runtime/ReaderRuntimeProvider";
import type {
 ReaderProgressOwner,
 ReaderPronunciationAnalysis,
} from "./useReaderStudyState";

type SelectionMode = "quick" | "note";

export function useReaderSelectionActions({
 resource,
 stateOwner,
 analysisBySegmentId,
 setSaveError,
}: {
 resource: ReaderDocumentResource;
 stateOwner: ReaderProgressOwner;
 analysisBySegmentId: ReadonlyMap<string, ReaderPronunciationAnalysis>;
 setSaveError: (error: string) => void;
}) {
 const queryClient = useQueryClient();
 const tts = useSharedMandarinTts();
 const { openInspector } = useVocabInspector();
 const commands = useReaderRuntimeCommands();
 const runtimeActions = useReaderRuntimeActions();
 const [selection, setSelection] = useState<ReaderSurfaceSelection | null>(null);
 const [mode, setMode] = useState<SelectionMode>("quick");
 const [noteDraft, setNoteDraft] = useState("");
 const analysis = selection ? analysisBySegmentId.get(selection.segment.id) : undefined;
 const vocabulary = selection
  ? resource.vocabulary.find((item) => item.word === selection.text)
  : undefined;
 const selectedPinyin =
  selection && analysis && selection.start !== null && selection.end !== null
   ? formatContextualPinyinRange(analysis, selection.start, selection.end)
   : "";

 const clear = useCallback(() => {
  setSelection(null);
  setMode("quick");
  setNoteDraft("");
  window.getSelection()?.removeAllRanges();
 }, []);
 const handleSelection = useCallback(
  (next: ReaderSurfaceSelection) => {
   runtimeActions.selectSegment(next.segment.id, "scroll");
   setSelection(next);
   setMode("quick");
   setNoteDraft("");
  },
  [runtimeActions],
 );
 const invalidateAnnotations = () =>
  queryClient.invalidateQueries({
   queryKey:
    stateOwner === "reader"
     ? hanzihomeQueryKeys.readerState(resource.document.id)
     : hanzihomeQueryKeys.readerAnnotations(resource.document.id),
  });
 const saveAnnotation = (annotationType: "highlight" | "note") => {
  if (!selection || selection.start === null || selection.end === null) return;
  void createReaderAnnotation({
   documentId: resource.document.id,
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
  })
   .then(() => {
    if (annotationType === "highlight") {
     const now = new Date().toISOString();
     void upsertLearningLoopItem({
      id: `reader-bookmark:${resource.document.id}:${selection.segment.id}:${selection.start}`,
      stable_key: `reader-bookmark:${resource.document.id}:${selection.segment.id}:${selection.start}`,
      kind: "reading_bookmark",
      source_id: resource.document.id,
      source_href: `/reader?document=${encodeURIComponent(resource.document.id)}`,
      title_zh: resource.document.title_zh,
      title_vi: resource.document.title_vi,
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
   .catch((annotationError: Error) => setSaveError(annotationError.message));
 };
 const removeAnnotation = (annotationId: string, revision: number) => {
  void deleteReaderAnnotation(annotationId, revision)
   .then(invalidateAnnotations)
   .catch((annotationError: Error) => setSaveError(annotationError.message));
 };
 const addToReview = () => {
  if (!selection || selection.start === null) return;
  const now = new Date().toISOString();
  void upsertLearningLoopItem({
   id: `reader-selection:${resource.document.id}:${selection.segment.id}:${selection.start}`,
   stable_key: `reader-selection:${resource.document.id}:${selection.segment.id}:${selection.start}`,
   kind: vocabulary === undefined ? "reading_bookmark" : "vocabulary",
   source_id: resource.document.id,
   source_href: `/reader?document=${encodeURIComponent(resource.document.id)}`,
   title_zh: resource.document.title_zh,
   title_vi: resource.document.title_vi,
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

 const popover = selection ? (
  <Popover.Root open modal={false} onOpenChange={(open) => !open && clear()}>
   <Popover.Portal>
    <BasePopoverPositioner
     anchor={anchor}
     side="top"
     align="center"
     sideOffset={10}
     collisionPadding={8}
     positionMethod="fixed"
    >
     <BasePopoverPopup variant="lookup" data-no-inspector onMouseDown={(event) => event.preventDefault()}>
      <div className="grid gap-3 p-3">
       <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
         <Typography as="strong" variant="cardTitle" lang="zh-CN" clamp="one">
          {selection.text}
         </Typography>
         <PinyinText variant="caption" tone="muted">
          {selectedPinyin || "Chưa xác định pinyin"}
         </PinyinText>
        </div>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Đóng thanh công cụ" onClick={clear}>
         <X aria-hidden="true" />
        </Button>
       </div>
       {mode === "quick" ? (
        <>
         <Typography variant="bodySmall" tone="muted">
          {vocabulary?.meaning || "Chưa có nghĩa offline chính xác cho cụm này."}
         </Typography>
         <div className="grid grid-cols-3 gap-1" role="toolbar" aria-label="Thao tác đoạn chọn">
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
           Tra từ
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => saveAnnotation("highlight")}>
           <Highlighter data-icon="inline-start" />
           Đánh dấu
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode("note")}>
           <StickyNote data-icon="inline-start" />
           Ghi chú
          </Button>
         </div>
        </>
       ) : (
        <>
         <Textarea
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="Ghi chú cho đoạn chọn…"
          aria-label="Ghi chú cho đoạn chọn"
          rows={2}
         />
         <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode("quick")}>
           Huỷ
          </Button>
          <Button type="button" size="sm" disabled={!noteDraft.trim()} onClick={() => saveAnnotation("note")}>
           Lưu ghi chú
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
          commands.stop();
          tts.speakSequence([selection.text]);
         }}
        >
         <Volume2 data-icon="inline-start" />
         Nghe
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={addToReview}>
         <BookmarkPlus data-icon="inline-start" />
         Ôn lại
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
         Hiểu sâu
        </Button>
       </div>
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 ) : null;

 return { handleSelection, popover, removeAnnotation };
}
