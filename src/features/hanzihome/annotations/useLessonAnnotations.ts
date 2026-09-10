"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
 createLessonAnnotation,
 deleteLessonAnnotation,
 fetchLessonAnnotations,
 updateLessonAnnotationNote,
} from "./lesson-annotation-api";
import { lessonAnnotationQueryKeys } from "./query-keys";
import type { AnnotationAnchor, LessonTextAnnotation } from "./types";

export function useLessonAnnotations(lessonId: string) {
 const queryClient = useQueryClient();
 const queryKey = lessonAnnotationQueryKeys.byLesson(lessonId);

 const query = useQuery({
  queryKey,
  enabled: !!lessonId,
  queryFn: () => fetchLessonAnnotations(lessonId),
 });

 const createMutation = useMutation({
  mutationFn: async ({ anchor, noteText }: { anchor: AnnotationAnchor; noteText?: string }) => {
   return createLessonAnnotation({ anchor, ...(noteText ? { noteText } : {}) });
  },
  onMutate: async ({ anchor, noteText }) => {
   await queryClient.cancelQueries({ queryKey });
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
     noteText: noteText || "",
     createdAt: now,
     updatedAt: now,
    },
   ]);
   return { tempId };
  },
  onSuccess: (savedAnnotation, _variables, context) => {
   queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
    if (!current) return [savedAnnotation];
    return current.map((item) => (item.id === context?.tempId ? savedAnnotation : item));
   });
  },
  onError: (_error, _variables, context) => {
   if (context?.tempId) {
    queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
     if (!current) return [];
     return current.filter((item) => item.id !== context.tempId);
    });
   }
  },
 });

 const noteMutation = useMutation({
  mutationFn: async ({ annotationId, noteText }: { annotationId: string; noteText: string }) => {
   return updateLessonAnnotationNote({ annotationId, noteText });
  },
  onMutate: async ({ annotationId, noteText }) => {
   await queryClient.cancelQueries({ queryKey });
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
  onSuccess: (savedAnnotation) => {
   queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => {
    if (!current) return [];
    return current.map((item) => (item.id === savedAnnotation.id ? savedAnnotation : item));
   });
  },
  onError: (_error, _variables, context) => {
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
  mutationFn: (annotationId: string) => deleteLessonAnnotation(annotationId),
  onMutate: async (annotationId) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   const target = previous.find((annotation) => annotation.id === annotationId);
   const targetIndex = previous.findIndex((annotation) => annotation.id === annotationId);
   queryClient.setQueryData<LessonTextAnnotation[]>(
    queryKey,
    previous.filter((annotation) => annotation.id !== annotationId),
   );
   return { deletedAnnotation: target, index: targetIndex };
  },
  onError: (_error, _variables, context) => {
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
  createAnnotation: createMutation.mutateAsync,
  updateAnnotationNote: noteMutation.mutateAsync,
  deleteAnnotation: deleteMutation.mutateAsync,
  isMutating: createMutation.isPending || noteMutation.isPending || deleteMutation.isPending,
 };
}
