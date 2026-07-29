"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseErrorLike, type ErrorInput } from "@/types/error";
import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useState,
 type ReactNode,
} from "react";
import { Bookmark, Highlighter, Languages, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { containsChinese } from "@/lib/chinese-utils";

import { createAnnotationAnchor, resolveAnnotationAnchor } from "./annotation-anchor";
import {
 AnnotationAnchorSchema,
 LessonTextAnnotationSchema,
 type AnnotationAnchor,
 type LessonTextAnnotation,
 type ResolvedLessonTextAnnotation,
} from "./types";
import { useLessonAnnotations } from "./useLessonAnnotations";

type AnnotationTarget = {
 lessonId: string;
 nodeType: string;
 nodeId: string;
};

type SelectionDraft = {
 anchor: AnnotationAnchor;
 rect: ReturnType<Range["getBoundingClientRect"]>;
 sourceText: string;
};

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

const NoteDialogSchema = z.discriminatedUnion("kind", [
 z.object({ kind: z.literal("anchor"), anchor: AnnotationAnchorSchema }),
 z.object({ kind: z.literal("annotation"), annotation: LessonTextAnnotationSchema }),
]);

type AnnotationContextValue = {
 getAnnotations: (target: AnnotationTarget, text: string) => ResolvedLessonTextAnnotation[];
 openAnnotation: (annotation: LessonTextAnnotation) => void;
};

const AnnotationContext = createContext<Nullable<AnnotationContextValue>>(null);

export function useLessonAnnotationContext() {
 return useContext(AnnotationContext);
}

function getSelectionOffsets(container: HTMLElement, range: Range) {
 if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
  return null;
 }

 const beforeStart = document.createRange();
 beforeStart.selectNodeContents(container);
 beforeStart.setEnd(range.startContainer, range.startOffset);
 const beforeEnd = document.createRange();
 beforeEnd.selectNodeContents(container);
 beforeEnd.setEnd(range.endContainer, range.endOffset);

 return {
  startOffset: beforeStart.toString().length,
  endOffset: beforeEnd.toString().length,
 };
}

function closestAnnotationTarget(node: Node) {
 const element = node instanceof Element ? node : node.parentElement;
 return element?.closest<HTMLElement>("[data-study-annotation-node]") || null;
}

function selectionTarget(range: Range) {
 const startTarget = closestAnnotationTarget(range.startContainer);
 const endTarget = closestAnnotationTarget(range.endContainer);
 return startTarget && startTarget === endTarget ? startTarget : null;
}

function getSelectionRect(range: Range) {
 const rects = Array.from(range.getClientRects()).filter((rect) => rect.width || rect.height);
 return (
  rects.at(-1) || (range.getBoundingClientRect().width ? range.getBoundingClientRect() : null)
 );
}

function annotationErrorMessage(error: ErrorInput, fallback: string) {
 const candidate = parseErrorLike(error);
 if (candidate.code === "PGRST205" || candidate.code === "42883") {
  return "Database chưa có migration ghi chú. Hãy đồng bộ migration rồi thử lại.";
 }
 return candidate.message ? `${fallback}: ${candidate.message}` : fallback;
}

export function LessonAnnotationProvider({
 lessonId,
 children,
}: {
 lessonId: string;
 children: ReactNode;
}) {
 const annotationState = useLessonAnnotations(lessonId);
 const { openInspector } = useVocabInspector();
 const [selectionDraft, setSelectionDraft] = useState<Nullable<SelectionDraft>>(null);
 const [noteDialog, setNoteDialog] = useState<Nullable<z.infer<typeof NoteDialogSchema>>>(null);
 const [noteText, setNoteText] = useState("");
 const selectionAnchor = useCallback(
  () =>
   selectionDraft
    ? {
       getBoundingClientRect: () => selectionDraft.rect,
       contextElement: document.body,
      }
    : null,
  [selectionDraft],
 );
 const closeSelectionMenu = useCallback(() => setSelectionDraft(null), []);

 useEffect(() => {
  const selectionTimer = { current: 0 };
  const captureSelection = (delay = 120) => {
   window.clearTimeout(selectionTimer.current);
   selectionTimer.current = window.setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;

    const range = selection.getRangeAt(0);
    const target = selectionTarget(range);
    if (!target || target.dataset.lessonId !== lessonId) return;

    const offsets = getSelectionOffsets(target, range);
    const sourceText = target.textContent || "";
    if (!offsets || !containsChinese(range.toString())) return;

    const anchor = createAnnotationAnchor({
     lessonId,
     nodeType: target.dataset.nodeType || "text",
     nodeId: target.dataset.nodeId || "",
     text: sourceText,
     ...offsets,
    });
    const rect = getSelectionRect(range);
    if (!anchor || !anchor.nodeId || !rect) return;

    setSelectionDraft({ anchor, rect, sourceText });
   }, delay);
  };

  const handleSelectionChange = () => captureSelection();
  const captureSettledSelection = (event: Event) => {
   const target = event.target;
   if (target instanceof Element && target.closest("[data-no-inspector]")) return;
   captureSelection(0);
  };

  document.addEventListener("selectionchange", handleSelectionChange);
  document.addEventListener("pointerup", captureSettledSelection);
  document.addEventListener("keyup", captureSettledSelection);
  return () => {
   window.clearTimeout(selectionTimer.current);
   document.removeEventListener("selectionchange", handleSelectionChange);
   document.removeEventListener("pointerup", captureSettledSelection);
   document.removeEventListener("keyup", captureSettledSelection);
  };
 }, [lessonId]);

 const getAnnotations = useCallback(
  (target: AnnotationTarget, text: string) =>
   annotationState.annotations
    .filter(
     (annotation) =>
      annotation.lessonId === target.lessonId &&
      annotation.nodeType === target.nodeType &&
      annotation.nodeId === target.nodeId,
    )
    .map((annotation) => resolveAnnotationAnchor(annotation, text))
    .filter((annotation) => !annotation.stale),
  [annotationState.annotations],
 );

 const overlapsExistingAnnotation = (anchor: AnnotationAnchor) =>
  getAnnotations(anchor, selectionDraft?.sourceText || "").some(
   (annotation) =>
    anchor.startOffset < annotation.resolvedEndOffset &&
    anchor.endOffset > annotation.resolvedStartOffset,
  );

 const handleHighlight = async () => {
  if (!selectionDraft) return;
  if (overlapsExistingAnnotation(selectionDraft.anchor)) {
   toast.error("Đoạn này đã nằm trong một highlight khác.");
   return;
  }

  try {
   await annotationState.createAnnotation({ anchor: selectionDraft.anchor });
   toast.success("Đã highlight đoạn đã chọn.");
   closeSelectionMenu();
   window.getSelection()?.removeAllRanges();
  } catch (error) {
   toast.error(annotationErrorMessage(error, "Không thể lưu highlight"));
  }
 };

 const openNewNote = () => {
  if (!selectionDraft) return;
  if (overlapsExistingAnnotation(selectionDraft.anchor)) {
   toast.error("Hãy mở highlight hiện có để thêm ghi chú.");
   return;
  }
  setNoteText("");
  setNoteDialog({
   kind: NoteDialogSchema.options[0].shape.kind.value,
   anchor: selectionDraft.anchor,
  });
  closeSelectionMenu();
 };

 const openAnnotation = useCallback((annotation: LessonTextAnnotation) => {
  setNoteText(annotation.noteText);
  setNoteDialog({ kind: "annotation", annotation });
 }, []);

 const saveNote = async () => {
  if (!noteDialog || !noteText.trim()) return;
  try {
   if (noteDialog.kind === "annotation") {
    await annotationState.updateAnnotationNote({
     annotationId: noteDialog.annotation.id,
     noteText: noteText.trim(),
    });
   } else {
    await annotationState.createAnnotation({
     anchor: noteDialog.anchor,
     noteText: noteText.trim(),
    });
   }
   toast.success("Đã lưu ghi chú.");
   setNoteDialog(null);
   window.getSelection()?.removeAllRanges();
  } catch (error) {
   toast.error(annotationErrorMessage(error, "Không thể lưu ghi chú"));
  }
 };

 const deleteAnnotation = async () => {
  if (noteDialog?.kind !== "annotation") return;
  try {
   await annotationState.deleteAnnotation(noteDialog.annotation.id);
   toast.success("Đã xóa highlight.");
   setNoteDialog(null);
  } catch (error) {
   toast.error(annotationErrorMessage(error, "Không thể xóa highlight"));
  }
 };

 const contextValue = useMemo(
  () => ({ getAnnotations, openAnnotation }),
  [getAnnotations, openAnnotation],
 );

 return (
  <AnnotationContext.Provider value={contextValue}>
   {children}

   <Popover.Root
    open={!!selectionDraft}
    onOpenChange={(open) => !open && closeSelectionMenu()}
    modal={false}
   >
    <Popover.Portal>
     <BasePopoverPositioner
      anchor={selectionAnchor}
      side="top"
      align="center"
      sideOffset={10}
      collisionPadding={8}
      positionMethod="fixed"
     >
      <BasePopoverPopup variant="actions" initialFocus={false} finalFocus={false} data-no-inspector>
       <Button
        size="sm"
        variant="ghost"
        onClick={() => {
         if (!selectionDraft) return;
         const { anchor, rect } = selectionDraft;
         closeSelectionMenu();
         window.getSelection()?.removeAllRanges();
         void openInspector(anchor.selectedText, {
          lessonId,
          anchorRect: rect,
         });
        }}
       >
        <Languages />
        Tra từ
       </Button>
       <Button size="sm" variant="ghost" onClick={handleHighlight}>
        <Highlighter />
        Highlight
       </Button>
       <Button size="sm" variant="ghost" onClick={openNewNote}>
        <StickyNote />
        Ghi chú
       </Button>
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </Popover.Portal>
   </Popover.Root>

   <Dialog open={!!noteDialog} onOpenChange={(open) => !open && setNoteDialog(null)}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle icon={<Bookmark />}>Ghi chú đoạn đọc</DialogTitle>
      <DialogDescription>
       {noteDialog?.kind === "annotation"
        ? noteDialog.annotation.selectedText
        : noteDialog?.anchor.selectedText}
      </DialogDescription>
     </DialogHeader>
     <DialogBody>
      <Label variant="label" tone="secondary" weight="bold" className="grid gap-2">
       Nội dung ghi chú
       <Textarea
        value={noteText}
        onChange={(event) => setNoteText(event.target.value)}
        rows={6}
        autoFocus
        density="comfortable"
        className="w-full"
        placeholder="Điều cần nhớ về đoạn này…"
       />
      </Label>
     </DialogBody>
     <DialogFooter>
      {noteDialog?.kind === "annotation" ? (
       <Button
        variant="destructive"
        onClick={deleteAnnotation}
        disabled={annotationState.isMutating}
       >
        <Trash2 />
        Xóa highlight
       </Button>
      ) : null}
      <div className="flex-1" />
      <DialogClose asChild>
       <Button variant="outline">Hủy</Button>
      </DialogClose>
      <Button onClick={saveNote} disabled={!noteText.trim() || annotationState.isMutating}>
       Lưu
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </AnnotationContext.Provider>
 );
}
