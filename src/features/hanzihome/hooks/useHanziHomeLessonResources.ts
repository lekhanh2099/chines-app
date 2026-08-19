"use client";

import { useQuery } from "@tanstack/react-query";

import {
 fetchHanziHomeLessonDetail,
 fetchHanziHomeLessonVocabulary,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 buildLessonSectionsResource,
 attachLessonVocabularyResource,
 type LessonSectionsResource,
 type LessonVocabularyListResource,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";

const lessonResourceStaleTime = Infinity;

export function useHanziHomeLessonDetailResource(lessonId: string) {
 return useQuery({
  queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
  queryFn: () => fetchHanziHomeLessonDetail(lessonId),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
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
 return useQuery<LessonVocabularyListResource | null>({
  queryKey: hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary"),
  queryFn: () => fetchHanziHomeLessonVocabulary(lessonId),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
 });
}
