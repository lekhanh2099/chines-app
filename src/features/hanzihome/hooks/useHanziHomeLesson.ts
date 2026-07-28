"use client";

import { attachLessonVocabularyResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 useHanziHomeLessonDetailResource,
 useHanziHomeLessonVocabulary,
} from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import { z } from "zod";

const LessonIdSchema = z.string().nullable();

export function useHanziHomeLesson(lessonId: z.infer<typeof LessonIdSchema>) {
 const detailQuery = useHanziHomeLessonDetailResource(lessonId ?? "");
 const vocabularyQuery = useHanziHomeLessonVocabulary(lessonId ?? "");
 const lesson =
  detailQuery.data && vocabularyQuery.data
   ? attachLessonVocabularyResource(detailQuery.data, vocabularyQuery.data)
   : null;

 return {
  ...detailQuery,
  refetch: async () => {
   await Promise.all([detailQuery.refetch(), vocabularyQuery.refetch()]);
  },
  lesson,
  isLoading: Boolean(lessonId) && (detailQuery.isPending || vocabularyQuery.isPending),
  isError: detailQuery.isError || vocabularyQuery.isError,
 };
}
