"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import {
 fetchHanziHomeLessonDetail,
 fetchHanziHomeLessonVocabulary,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 buildLessonGrammarResource,
 buildLessonOverviewResource,
 buildLessonSectionsResource,
 attachLessonVocabularyResource,
 type LessonGrammarListResource,
 type LessonOverviewResource,
 type LessonSectionsResource,
 type LessonVocabularyListResource,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";

const lessonResourceStaleTime = Infinity;
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export function useHanziHomeLessonDetailResource(lessonId: string) {
 return useQuery({
  queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
  queryFn: () => fetchHanziHomeLessonDetail(lessonId),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
 });
}

export function useHanziHomeLessonOverview(lessonId: string): Nullable<LessonOverviewResource> {
 const detailQuery = useHanziHomeLessonDetailResource(lessonId);
 const vocabularyQuery = useHanziHomeLessonVocabulary(lessonId);

 return detailQuery.data && vocabularyQuery.data
  ? buildLessonOverviewResource(
     attachLessonVocabularyResource(detailQuery.data, vocabularyQuery.data),
    )
  : null;
}

export function useHanziHomeLessonSections(lessonId: string): Nullable<LessonSectionsResource> {
 const detailQuery = useHanziHomeLessonDetailResource(lessonId);
 const vocabularyQuery = useHanziHomeLessonVocabulary(lessonId);

 return detailQuery.data && vocabularyQuery.data
  ? buildLessonSectionsResource(
     attachLessonVocabularyResource(detailQuery.data, vocabularyQuery.data),
    )
  : null;
}

export function useHanziHomeLessonVocabulary(lessonId: string) {
 return useQuery<Nullable<LessonVocabularyListResource>>({
  queryKey: hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary"),
  queryFn: () => fetchHanziHomeLessonVocabulary(lessonId),
  staleTime: lessonResourceStaleTime,
  enabled: Boolean(lessonId),
 });
}

export function useHanziHomeLessonGrammar(lessonId: string): Nullable<LessonGrammarListResource> {
 const query = useHanziHomeLessonDetailResource(lessonId);

 return query.data ? buildLessonGrammarResource(query.data) : null;
}
