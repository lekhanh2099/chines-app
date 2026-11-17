"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useClientSession } from "@/components/providers/QueryProvider";
import {
 fetchPracticeAttempts,
 savePracticeAttempt,
} from "@/features/hanzihome/practice/practice-attempt-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

type LessonExerciseResults = {
 /** Whether the latest saved attempt of an exercise block was correct. */
 latestByBlock: ReadonlyMap<string, boolean>;
 record: (blockId: string, correct: boolean, answer: string) => void;
};

const noResults: LessonExerciseResults = { latestByBlock: new Map(), record: () => {} };
const LessonExerciseResultsContext = createContext<LessonExerciseResults>(noResults);

/** The saved exercise attempts of one lesson; inert outside the provider or when signed out. */
export function useLessonExerciseResults() {
 return useContext(LessonExerciseResultsContext);
}

/**
 * Loads the learner's exercise attempts of a lesson once and saves new ones.
 * Attempts are stored per lesson (`content_id`) with the exercise block id in
 * `direction`, so one request restores every exercise of the lesson.
 */
export function LessonExerciseResultsProvider({
 lessonId,
 children,
}: {
 lessonId: string;
 children: ReactNode;
}) {
 const t = useTranslations("BusinessChinese");
 const { userId } = useClientSession();
 const queryClient = useQueryClient();
 const queryKey = useMemo(
  () => hanzihomeQueryKeys.exerciseResults(userId ?? "", lessonId),
  [lessonId, userId],
 );
 const attempts = useQuery({
  queryKey,
  queryFn: () => fetchPracticeAttempts({ surface: "exercise", contentId: lessonId }),
  enabled: Boolean(userId),
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
 });

 const latestByBlock = useMemo(() => {
  const latest = new Map<string, boolean>();
  // Attempts arrive newest first: the first one seen per block is the latest.
  for (const attempt of attempts.data ?? []) {
   if (attempt.direction && !latest.has(attempt.direction)) {
    latest.set(attempt.direction, attempt.score === 1);
   }
  }
  return latest;
 }, [attempts.data]);

 const record = useCallback(
  (blockId: string, correct: boolean, answer: string) => {
   if (!userId) return;
   savePracticeAttempt(
    {
     surface: "exercise",
     contentId: lessonId,
     direction: blockId,
     answer: { text: answer },
     scorePercent: correct ? 100 : 0,
     responseMs: null,
    },
    { expectedOwnerId: userId },
   )
    .then((attempt) =>
     queryClient.setQueryData<Awaited<ReturnType<typeof fetchPracticeAttempts>>>(
      queryKey,
      (current) => [attempt, ...(current ?? [])],
     ),
    )
    .catch(() => toast.error(t("practice.saveFailed")));
  },
  [lessonId, queryClient, queryKey, t, userId],
 );

 const value = useMemo(() => ({ latestByBlock, record }), [latestByBlock, record]);
 return (
  <LessonExerciseResultsContext.Provider value={value}>
   {children}
  </LessonExerciseResultsContext.Provider>
 );
}
