"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";

import {
 createLessonAnnotation,
 deleteLessonAnnotation,
 fetchLessonAnnotations,
 updateLessonAnnotationNote,
 LessonAnnotationConflictError,
} from "./lesson-annotation-api";
import { lessonAnnotationQueryKeys } from "./query-keys";
import type { LessonTextAnnotation, LessonAnnotationNoteUpdate } from "./types";

export function useLessonAnnotations(lessonId: string) {
 const queryClient = useQueryClient();
 const { userId, isResolved } = useClientSession();
 const queryKey = lessonAnnotationQueryKeys.byLesson(userId, lessonId);
 const ownerRef = useRef(userId);
 const disposedRef = useRef(false);
 useEffect(() => {
  ownerRef.current = userId;
  disposedRef.current = false;
  return () => {
   disposedRef.current = true;
  };
 }, [userId]);

 const isCurrentOwner = (ownerUserId: string) =>
  isResolved && !disposedRef.current && userId === ownerUserId && ownerRef.current === ownerUserId;
 const requireOwner = () => {
  if (!userId || !isCurrentOwner(userId)) throw new Error("Annotation owner is no longer active.");
  return userId;
 };
 const requireCurrentOwner = (ownerUserId: string) => {
  if (!isCurrentOwner(ownerUserId)) throw new Error("Annotation owner is no longer active.");
 };
 const invalidateLinkedNote = (annotation: LessonTextAnnotation, ownerUserId: string) => {
  if (!annotation.noteId) return;
  void queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(ownerUserId) });
  void queryClient.invalidateQueries({ queryKey: noteQueryKeys.recentRoot(ownerUserId) });
  void queryClient.invalidateQueries({ queryKey: noteQueryKeys.lessonLinkedRoot(ownerUserId) });
  // Preserve staged editor content; the existing detail query restores drafts on its next read.
  void queryClient.invalidateQueries({
   queryKey: noteQueryKeys.detail(ownerUserId, annotation.noteId),
   refetchType: "none",
  });
 };

 const query = useQuery({
  queryKey,
  enabled: isResolved && !!userId && !!lessonId,
  queryFn: () => fetchLessonAnnotations(lessonId, requireOwner()),
 });

 const createMutation = useMutation({
  mutationFn: async ({
   input,
   ownerUserId,
  }: {
   input: Parameters<typeof createLessonAnnotation>[0];
   ownerUserId: string;
  }) => {
   requireCurrentOwner(ownerUserId);
   return createLessonAnnotation(
    { anchor: input.anchor, ...(input.noteText ? { noteText: input.noteText } : {}) },
    ownerUserId,
   );
  },
  onMutate: async ({ input: { anchor, noteText }, ownerUserId }) => {
   requireCurrentOwner(ownerUserId);
   await queryClient.cancelQueries({ queryKey });
   requireCurrentOwner(ownerUserId);
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   const tempId = `optimistic-${crypto.randomUUID()}`;
   const now = new Date().toISOString();
   queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, [
    ...previous,
    {
     id: tempId,
     lessonId: anchor.lessonId,
     nodeType: anchor.nodeType,
     nodeId: anchor.nodeId,
     startOffset: anchor.startOffset,
     endOffset: anchor.endOffset,
     selectedText: anchor.selectedText,
     prefixText: anchor.prefixText,
     suffixText: anchor.suffixText,
     tone: "focus",
     noteId: null,
     note: null,
     noteText: noteText || "",
     createdAt: now,
     updatedAt: now,
    },
   ]);
   return { tempId };
  },
  onSuccess: (savedAnnotation, variables, context) => {
   if (!isCurrentOwner(variables.ownerUserId)) return;
   queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
    if (!current) return [savedAnnotation];
    return current.map((item) => (item.id === context?.tempId ? savedAnnotation : item));
   });
   invalidateLinkedNote(savedAnnotation, variables.ownerUserId);
  },
  onError: (_error, variables, context) => {
   if (!isCurrentOwner(variables.ownerUserId)) return;
   if (context?.tempId) {
    queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
     if (!current) return [];
     return current.filter((item) => item.id !== context.tempId);
    });
   }
  },
 });

 const noteMutation = useMutation({
  mutationFn: ({
   input,
   ownerUserId,
  }: {
   input: LessonAnnotationNoteUpdate;
   ownerUserId: string;
  }) => {
   requireCurrentOwner(ownerUserId);
   return updateLessonAnnotationNote(input, ownerUserId);
  },
  onMutate: async ({ input: { annotationId, noteText }, ownerUserId }) => {
   requireCurrentOwner(ownerUserId);
   await queryClient.cancelQueries({ queryKey });
   requireCurrentOwner(ownerUserId);
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   const target = previous.find((item) => item.id === annotationId);
   queryClient.setQueryData<LessonTextAnnotation[]>(
    queryKey,
    previous.map((annotation) =>
     annotation.id === annotationId
      ? { ...annotation, noteText, updatedAt: new Date().toISOString() }
      : annotation,
    ),
   );
   return {
    annotationId,
    prevNoteText: target?.noteText,
    prevUpdatedAt: target?.updatedAt,
   };
  },
  onSuccess: (savedAnnotation, variables) => {
   if (!isCurrentOwner(variables.ownerUserId)) return;
   queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
    if (!current) return [];
    return current.map((item) => (item.id === savedAnnotation.id ? savedAnnotation : item));
   });
   invalidateLinkedNote(savedAnnotation, variables.ownerUserId);
  },
  onError: (error, variables, context) => {
   if (!isCurrentOwner(variables.ownerUserId)) return;
   if (error instanceof LessonAnnotationConflictError) {
    queryClient.setQueryData<LessonTextAnnotation[]>(
     queryKey,
     (current) =>
      current?.map((item) => (item.id === error.annotation.id ? error.annotation : item)) ?? [
       error.annotation,
      ],
    );
    invalidateLinkedNote(error.annotation, variables.ownerUserId);
    return;
   }
   if (context && context.prevNoteText !== undefined) {
    queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
     if (!current) return [];
     return current.map((item) =>
      item.id === context.annotationId
       ? {
          ...item,
          noteText: context.prevNoteText ?? "",
          updatedAt: context.prevUpdatedAt ?? item.updatedAt,
         }
       : item,
     );
    });
   }
  },
 });

 const deleteMutation = useMutation({
  mutationFn: ({ annotationId, ownerUserId }: { annotationId: string; ownerUserId: string }) => {
   requireCurrentOwner(ownerUserId);
   return deleteLessonAnnotation(annotationId, ownerUserId);
  },
  onMutate: async ({ annotationId, ownerUserId }) => {
   requireCurrentOwner(ownerUserId);
   await queryClient.cancelQueries({ queryKey });
   requireCurrentOwner(ownerUserId);
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   const target = previous.find((annotation) => annotation.id === annotationId);
   const targetIndex = previous.findIndex((annotation) => annotation.id === annotationId);
   queryClient.setQueryData<LessonTextAnnotation[]>(
    queryKey,
    previous.filter((annotation) => annotation.id !== annotationId),
   );
   return { deletedAnnotation: target, index: targetIndex };
  },
  onSuccess: (deleted, variables, context) => {
   if (!deleted || !isCurrentOwner(variables.ownerUserId) || !context?.deletedAnnotation) return;
   invalidateLinkedNote(context.deletedAnnotation, variables.ownerUserId);
  },
  onError: (_error, variables, context) => {
   if (!isCurrentOwner(variables.ownerUserId)) return;
   const deleted = context?.deletedAnnotation;
   if (deleted) {
    queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
     if (!current) return [deleted];
     if (current.some((item) => item.id === deleted.id)) {
      return current;
     }
     const copy = [...current];
     const insertAt =
      typeof context.index === "number" && context.index >= 0 && context.index <= copy.length
       ? context.index
       : copy.length;
     copy.splice(insertAt, 0, deleted);
     return copy;
    });
   }
  },
 });

 return {
  annotations: query.data || [],
  isLoading: query.isLoading,
  createAnnotation: async (input: Parameters<typeof createLessonAnnotation>[0]) =>
   createMutation.mutateAsync({ input, ownerUserId: requireOwner() }),
  updateAnnotationNote: async (input: LessonAnnotationNoteUpdate) =>
   noteMutation.mutateAsync({ input, ownerUserId: requireOwner() }),
  deleteAnnotation: async (annotationId: string) =>
   deleteMutation.mutateAsync({ annotationId, ownerUserId: requireOwner() }),
  isMutating: createMutation.isPending || noteMutation.isPending || deleteMutation.isPending,
 };
}
