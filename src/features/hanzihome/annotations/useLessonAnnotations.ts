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
   const now = new Date().toISOString();
   queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, [
    ...previous,
    {
     id: `optimistic-${crypto.randomUUID()}`,
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
   return { previous };
  },
  onError: (_error, _variables, context) => {
   queryClient.setQueryData(queryKey, context?.previous || []);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
 });
 const noteMutation = useMutation({
  mutationFn: async ({ annotationId, noteText }: { annotationId: string; noteText: string }) => {
   return updateLessonAnnotationNote({ annotationId, noteText });
  },
  onMutate: async ({ annotationId, noteText }) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   queryClient.setQueryData<LessonTextAnnotation[]>(
    queryKey,
    previous.map((annotation) =>
     annotation.id === annotationId
      ? { ...annotation, noteText, updatedAt: new Date().toISOString() }
      : annotation,
    ),
   );
   return { previous };
  },
  onError: (_error, _variables, context) => {
   queryClient.setQueryData(queryKey, context?.previous || []);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
 });
 const deleteMutation = useMutation({
  mutationFn: (annotationId: string) => deleteLessonAnnotation(annotationId),
  onMutate: async (annotationId) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   queryClient.setQueryData<LessonTextAnnotation[]>(
    queryKey,
    previous.filter((annotation) => annotation.id !== annotationId),
   );
   return { previous };
  },
  onError: (_error, _variables, context) => {
   queryClient.setQueryData(queryKey, context?.previous || []);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
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
