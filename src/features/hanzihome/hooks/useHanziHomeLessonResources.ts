"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHanziHomeLessonDetail } from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import {
 buildLessonGrammarResource,
 buildLessonOverviewResource,
 buildLessonSectionsResource,
 buildLessonVocabularyResource,
 type LessonGrammarListResource,
 type LessonOverviewResource,
 type LessonSectionsResource,
 type LessonVocabularyListResource,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";

const lessonResourceStaleTime = Infinity;

export const hanzihomeLessonResourceKeys = {
 detail: (lessonId: string) => ["hanzihome", "lesson-detail", lessonId] as const,
 overview: (lessonId: string) => ["hanzihome", "lesson-resource", lessonId, "overview"] as const,
 sections: (lessonId: string) => ["hanzihome", "lesson-resource", lessonId, "sections"] as const,
 vocabulary: (lessonId: string) =>
  ["hanzihome", "lesson-resource", lessonId, "vocabulary"] as const,
 grammar: (lessonId: string) => ["hanzihome", "lesson-resource", lessonId, "grammar"] as const,
};

function useHanziHomeLessonDetailResource(lessonId: string) {
 return useQuery({
  queryKey: hanzihomeLessonResourceKeys.detail(lessonId),
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

export function useHanziHomeLessonVocabulary(
 lessonId: string,
): LessonVocabularyListResource | null {
 const query = useHanziHomeLessonDetailResource(lessonId);

 return query.data ? buildLessonVocabularyResource(query.data) : null;
}

export function useHanziHomeLessonGrammar(lessonId: string): LessonGrammarListResource | null {
 const query = useHanziHomeLessonDetailResource(lessonId);

 return query.data ? buildLessonGrammarResource(query.data) : null;
}
