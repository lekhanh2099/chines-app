"use client";

import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useRef,
 useState,
 type ReactNode,
} from "react";
import { toast } from "sonner";

import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { LessonAnnotationConflictError } from "./lesson-annotation-api";

import { resolveAnnotationAnchor } from "./annotation-anchor";
import {
 annotationErrorMessage,
 NoteDialogSchema,
 type NoteDialogState,
 type Nullable,
} from "./annotation-note-dialog-model";
import { LessonAnnotationNoteDialog } from "./LessonAnnotationNoteDialog";
import { LessonAnnotationSelectionMenu } from "./LessonAnnotationSelectionMenu";
import type { AnnotationAnchor, LessonTextAnnotation, ResolvedLessonTextAnnotation } from "./types";
import { useLessonAnnotations } from "./useLessonAnnotations";
import { useLessonAnnotationSelection } from "./useLessonAnnotationSelection";

type AnnotationTarget = {
 lessonId: string;
 nodeType: string;
 nodeId: string;
};

type AnnotationContextValue = {
 getAnnotations: (target: AnnotationTarget, text: string) => ResolvedLessonTextAnnotation[];
 openAnnotation: (annotation: LessonTextAnnotation) => void;
 closeAnnotation: () => void;
};

const AnnotationContext = createContext<Nullable<AnnotationContextValue>>(null);

export function useLessonAnnotationContext() {
 return useContext(AnnotationContext);
}

export function LessonAnnotationProvider({
 lessonId,
 children,
}: {
 lessonId: string;
 children: ReactNode;
}) {
 const annotationState = useLessonAnnotations(lessonId);
 const disposedRef = useRef(false);
 const { openInspector } = useVocabInspector();
 const [noteDialog, setNoteDialog] = useState<Nullable<NoteDialogState>>(null);
 const [noteText, setNoteText] = useState("");
 const [noteConflict, setNoteConflict] = useState<Nullable<LessonTextAnnotation>>(null);

 useEffect(() => {
  disposedRef.current = false;
  return () => {
   disposedRef.current = true;
  };
 }, []);

 const { selectionDraft, selectionAnchor, closeSelectionMenu } =
  useLessonAnnotationSelection(lessonId);

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

 const lookUpSelection = () => {
  if (!selectionDraft) return;
  const { anchor, rect } = selectionDraft;
  closeSelectionMenu();
  window.getSelection()?.removeAllRanges();
  void openInspector(anchor.selectedText, {
   lessonId,
   anchorRect: rect,
  });
 };

 const handleHighlight = async () => {
  if (!selectionDraft) return;
  if (overlapsExistingAnnotation(selectionDraft.anchor)) {
   toast.error("Đoạn này đã nằm trong một highlight khác.");
   return;
  }

  try {
   await annotationState.createAnnotation({ anchor: selectionDraft.anchor });
   if (disposedRef.current) return;
   toast.success("Đã highlight đoạn đã chọn.");
   closeSelectionMenu();
   window.getSelection()?.removeAllRanges();
  } catch (error) {
   if (disposedRef.current) return;
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
  setNoteConflict(null);
  setNoteDialog({
   kind: NoteDialogSchema.options[0].shape.kind.value,
   anchor: selectionDraft.anchor,
  });
  closeSelectionMenu();
 };

 const openAnnotation = useCallback((annotation: LessonTextAnnotation) => {
  setNoteConflict(null);
  setNoteText(annotation.noteText);
  setNoteDialog({ kind: "annotation", annotation });
 }, []);
 const closeAnnotation = useCallback(() => {
  closeSelectionMenu();
  setNoteDialog(null);
  setNoteText("");
  setNoteConflict(null);
  window.getSelection()?.removeAllRanges();
 }, [closeSelectionMenu]);

 const saveNote = async (resolveConflict = false) => {
  if (!noteDialog || !noteText.trim()) return;
  if (resolveConflict && !noteConflict) return;
  try {
   if (noteDialog.kind === "annotation") {
    const base = resolveConflict && noteConflict ? noteConflict : noteDialog.annotation;
    await annotationState.updateAnnotationNote({
     annotationId: noteDialog.annotation.id,
     noteText: noteText.trim(),
     expectedRevision: base.note?.revision ?? null,
    });
   } else {
    await annotationState.createAnnotation({
     anchor: noteDialog.anchor,
     noteText: noteText.trim(),
    });
   }
   if (disposedRef.current) return;
   toast.success("Đã lưu ghi chú.");
   setNoteDialog(null);
   setNoteConflict(null);
   window.getSelection()?.removeAllRanges();
  } catch (error) {
   if (disposedRef.current) return;
   if (error instanceof LessonAnnotationConflictError) {
    setNoteConflict(error.annotation);
    return;
   }
   toast.error(annotationErrorMessage(error, "Không thể lưu ghi chú"));
  }
 };

 const deleteAnnotation = async () => {
  if (noteDialog?.kind !== "annotation") return;
  try {
   await annotationState.deleteAnnotation(noteDialog.annotation.id);
   if (disposedRef.current) return;
   toast.success("Đã xóa highlight.");
   setNoteDialog(null);
  } catch (error) {
   if (disposedRef.current) return;
   toast.error(annotationErrorMessage(error, "Không thể xóa highlight"));
  }
 };

 const keepServerVersion = () => {
  setNoteDialog(null);
  setNoteText("");
  setNoteConflict(null);
 };

 const contextValue = useMemo(
  () => ({ getAnnotations, openAnnotation, closeAnnotation }),
  [closeAnnotation, getAnnotations, openAnnotation],
 );

 return (
  <AnnotationContext.Provider value={contextValue}>
   {children}

   <LessonAnnotationSelectionMenu
    open={!!selectionDraft}
    anchor={selectionAnchor}
    onClose={closeSelectionMenu}
    onLookup={lookUpSelection}
    onHighlight={handleHighlight}
    onNote={openNewNote}
   />

   <LessonAnnotationNoteDialog
    noteDialog={noteDialog}
    noteText={noteText}
    noteConflict={noteConflict}
    isMutating={annotationState.isMutating}
    onNoteTextChange={setNoteText}
    onDismiss={() => setNoteDialog(null)}
    onDelete={deleteAnnotation}
    onSave={saveNote}
    onUseServer={keepServerVersion}
   />
  </AnnotationContext.Provider>
 );
}
