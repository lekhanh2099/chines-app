"use client";

import { useEffect } from "react";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";

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
import { lessonResourceStaleTime } from "@/features/hanzihome/utils/lesson-prefetch";

export { lessonResourceStaleTime };

export async function hydrateCachedLessonDetail(
 queryClient: QueryClient,
 ownerId: string,
 lessonId: string,
): Promise<boolean> {
 const queryKey = hanzihomeQueryKeys.lessonDetail(lessonId);
 if (queryClient.getQueryData(queryKey)) return false;
 try {
  const cached = await readCachedLessonDetail(ownerId, lessonId);
  if (cached && !queryClient.getQueryData(queryKey)) {
   queryClient.setQueryData(queryKey, cached, { updatedAt: 0 });
   return true;
  }
 } catch {
  // Non-fatal
 }
 return false;
}

export async function hydrateCachedLessonVocabulary(
 queryClient: QueryClient,
 ownerId: string,
 lessonId: string,
): Promise<boolean> {
 const queryKey = hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary");
 if (queryClient.getQueryData(queryKey)) return false;
 try {
  const cached = await readCachedLessonVocabulary(ownerId, lessonId);
  if (cached && !queryClient.getQueryData(queryKey)) {
   queryClient.setQueryData(queryKey, cached, { updatedAt: 0 });
   return true;
  }
 } catch {
  // Non-fatal
 }
 return false;
}

export function useHanziHomeLessonDetailResource(lessonId: string) {
 const { user } = useClientSession();
 const ownerId = user?.id ?? "anonymous";
 const queryClient = useQueryClient();
 const queryKey = hanzihomeQueryKeys.lessonDetail(lessonId);

 useEffect(() => {
  if (!lessonId) return;
  let active = true;
  void hydrateCachedLessonDetail(queryClient, ownerId, lessonId).then(() => {
   if (!active) return;
  });

  return () => {
   active = false;
  };
 }, [lessonId, ownerId, queryClient]);

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
  let active = true;
  void hydrateCachedLessonVocabulary(queryClient, ownerId, lessonId).then(() => {
   if (!active) return;
  });

  return () => {
   active = false;
  };
 }, [lessonId, ownerId, queryClient]);

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
