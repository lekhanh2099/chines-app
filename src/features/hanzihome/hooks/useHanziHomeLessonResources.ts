"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 buildLessonSectionsResource,
 attachLessonVocabularyResource,
 type LessonSectionsResource,
 type LessonVocabularyListResource,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 getErrorHttpStatus,
 loadLessonDetailWithCache,
 loadLessonVocabularyWithCache,
 readCachedLessonDetail,
 readCachedLessonVocabulary,
} from "@/features/hanzihome/local/lesson-content-cache";

const lessonResourceStaleTime = Infinity;

export function useHanziHomeLessonDetailResource(lessonId: string) {
 const { user } = useClientSession();
 const ownerId = user?.id ?? "anonymous";
 const queryClient = useQueryClient();
 const queryKey = hanzihomeQueryKeys.lessonDetail(lessonId);

 useEffect(() => {
  if (!lessonId) return;
  if (queryClient.getQueryData(queryKey)) return;

  let active = true;
  readCachedLessonDetail(ownerId, lessonId)
   .then((cached) => {
    if (active && cached && !queryClient.getQueryData(queryKey)) {
     queryClient.setQueryData(queryKey, cached);
    }
   })
   .catch(() => {});

  return () => {
   active = false;
  };
 }, [lessonId, ownerId, queryClient, queryKey]);

 return useQuery({
  queryKey,
  queryFn: ({ signal }) => loadLessonDetailWithCache({ queryClient, ownerId, lessonId, signal }),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
  retry: (failureCount, error) => {
   const status = getErrorHttpStatus(error);
   if (status === 401 || status === 403 || status === 404 || status === 412) {
    return false;
   }
   return failureCount < 2;
  },
 });
}

export function useHanziHomeLessonSections(lessonId: string): LessonSectionsResource | null {
 const detailQuery = useHanziHomeLessonDetailResource(lessonId);
 const vocabularyQuery = useHanziHomeLessonVocabulary(lessonId);

 return detailQuery.data && vocabularyQuery.data
  ? buildLessonSectionsResource(
     attachLessonVocabularyResource(detailQuery.data, vocabularyQuery.data),
    )
  : null;
}

export function useHanziHomeLessonVocabulary(lessonId: string) {
 const { user } = useClientSession();
 const ownerId = user?.id ?? "anonymous";
 const queryClient = useQueryClient();
 const queryKey = hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary");

 useEffect(() => {
  if (!lessonId) return;
  if (queryClient.getQueryData(queryKey)) return;

  let active = true;
  readCachedLessonVocabulary(ownerId, lessonId)
   .then((cached) => {
    if (active && cached && !queryClient.getQueryData(queryKey)) {
     queryClient.setQueryData(queryKey, cached);
    }
   })
   .catch(() => {});

  return () => {
   active = false;
  };
 }, [lessonId, ownerId, queryClient, queryKey]);

 return useQuery<LessonVocabularyListResource | null>({
  queryKey,
  queryFn: ({ signal }) =>
   loadLessonVocabularyWithCache({ queryClient, ownerId, lessonId, signal }),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
  retry: (failureCount, error) => {
   const status = getErrorHttpStatus(error);
   if (status === 401 || status === 403 || status === 404 || status === 412) {
    return false;
   }
   return failureCount < 2;
  },
 });
}
