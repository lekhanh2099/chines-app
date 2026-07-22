"use client";

import { useQuery } from "@tanstack/react-query";

import {
 fetchHanziHomeLessonDetail,
 fetchHanziHomeLessonVocabulary,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 buildLessonGrammarResource,
 buildLessonOverviewResource,
 buildLessonSectionsResource,
 type LessonGrammarListResource,
 type LessonOverviewResource,
 type LessonSectionsResource,
 type LessonVocabularyListResource,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";

const lessonResourceStaleTime = Infinity;

function useHanziHomeLessonDetailResource(lessonId: string) {
 return useQuery({
  queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
  queryFn: () => fetchHanziHomeLessonDetail(lessonId),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
 });
}

export function useHanziHomeLessonOverview(lessonId: string): LessonOverviewResource | null {
 const query = useHanziHomeLessonDetailResource(lessonId);

 return query.data ? buildLessonOverviewResource(query.data) : null;
}

export function useHanziHomeLessonSections(lessonId: string): LessonSectionsResource | null {
 const query = useHanziHomeLessonDetailResource(lessonId);

 return query.data ? buildLessonSectionsResource(query.data) : null;
}

export function useHanziHomeLessonVocabulary(lessonId: string) {
 return useQuery<LessonVocabularyListResource | null>({
  queryKey: hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary"),
  queryFn: () => fetchHanziHomeLessonVocabulary(lessonId),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
 });
}

export function useHanziHomeLessonGrammar(lessonId: string): LessonGrammarListResource | null {
 const query = useHanziHomeLessonDetailResource(lessonId);

 return query.data ? buildLessonGrammarResource(query.data) : null;
}
