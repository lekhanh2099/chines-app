"use client";

import { useQuery } from "@tanstack/react-query";
import { startOfToday } from "date-fns";
import { useMemo } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 fetchPracticeAttemptCount,
 fetchRecentPracticeAttempts,
} from "@/features/hanzihome/practice/practice-attempt-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { useRecentNotes } from "@/features/notes/hooks/useRecentNotes";
import { fetchHomeLearningOverview } from "@/features/home/home-learning-overview-api";
import { buildHomeRecentActivity } from "@/features/home/home-dashboard.utils";
import type { HomeDashboardModel } from "@/features/home/types";

export function useHomeDashboard(): HomeDashboardModel {
 const { userId, isResolved } = useClientSession();
 const catalogQuery = useHanziHomeCatalogQuery({ includeLessons: true });
 const catalog = catalogQuery.data;
 const learning = useLearningState();
 const recentNotes = useRecentNotes(3);
 const todayStart = startOfToday().toISOString();
 const learningOverviewQuery = useQuery({
  queryKey: hanzihomeQueryKeys.homeLearningOverview(userId),
  enabled: isResolved && userId !== null,
  queryFn: fetchHomeLearningOverview,
  staleTime: 30_000,
  refetchOnMount: "always",
 });
 const reviewAttemptsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.practiceAttemptsRecent(userId, "review"),
  enabled: isResolved && userId !== null,
  queryFn: () =>
   userId ? fetchRecentPracticeAttempts({ surface: "review", limit: 50 }) : Promise.resolve([]),
  staleTime: 30_000,
  refetchOnMount: "always",
 });
 const reviewTodayCountQuery = useQuery({
  queryKey: hanzihomeQueryKeys.practiceAttemptsCount(userId, "review", todayStart),
  enabled: isResolved && userId !== null,
  queryFn: () =>
   userId
    ? fetchPracticeAttemptCount({
       surface: "review",
       since: todayStart,
       until: new Date().toISOString(),
      })
    : Promise.resolve(0),
  staleTime: 30_000,
  refetchOnMount: "always",
 });

 return useMemo(() => {
  const lastLessonId = learning.state.settings.lastLessonId;
  const recentLesson = catalog.lessons.find((lesson) => lesson.id === lastLessonId);
  const fallbackLesson = catalog.lessons[0] ?? null;
  const lesson = recentLesson ?? fallbackLesson;
  const course = lesson ? catalog.courses.find((item) => item.id === lesson.courseId) : null;
  const lastModule = learning.state.settings.lastModule ?? "overview";
  const progressItems = [
   ...Object.values(learning.state.progress.vocab ?? {}),
   ...Object.values(learning.state.progress.grammar ?? {}),
  ];
  const reviewCount = progressItems.filter(
   (item) => item.status === "learning" || item.status === "hard",
  ).length;
  const knownCount = progressItems.filter((item) => item.status === "known").length;
  const attempts = reviewAttemptsQuery.data ?? [];
  const reviewedTodayCount = reviewTodayCountQuery.data ?? 0;
  const learningOverview = learningOverviewQuery.data;
  const bookmarkedCount = Object.values(learning.state.bookmarks).reduce(
   (total, items) => total + (items?.length ?? 0),
   0,
  );
  const recentActivity = buildHomeRecentActivity(attempts);

  return {
   lesson:
    lesson && lesson.courseId
     ? {
        href: `/hanzihome?courseId=${lesson.courseId}&lesson=${lesson.lessonNumber}&module=${lastModule}`,
        title: lesson.title,
        titleZh: lesson.titleZh,
        courseTitle: course?.title ?? lesson.courseTitle ?? "HanziHome",
        lessonNumber: lesson.lessonNumber,
        module: lastModule,
        isRecent: Boolean(recentLesson),
       }
     : null,
   learningPulse: {
    trackedCount: progressItems.length,
    reviewCount,
    knownCount,
    reviewedTodayCount,
    bookmarkedCount,
    srsDueCount: learningOverview?.srsDueCount ?? 0,
    learningLoopDueCount: learningOverview?.learningLoopDueCount ?? 0,
    readerCompletedCount: learningOverview?.readerCompletedCount ?? 0,
    readerDocumentCount: learningOverview?.readerDocumentCount ?? 0,
    overviewUnavailable: learningOverviewQuery.isError,
   },
   recentActivity,
   recentNotes: recentNotes.data ?? [],
   isLoading:
    catalogQuery.isPending ||
    learning.isLoading ||
    recentNotes.isLoading ||
    (userId !== null &&
     (reviewAttemptsQuery.isPending ||
      reviewTodayCountQuery.isPending ||
      learningOverviewQuery.isPending)),
  };
 }, [
  catalog.courses,
  catalog.lessons,
  catalogQuery.isPending,
  learning.isLoading,
  learning.state,
  recentNotes.data,
  recentNotes.isLoading,
  learningOverviewQuery.data,
  learningOverviewQuery.isError,
  learningOverviewQuery.isPending,
  reviewAttemptsQuery.data,
  reviewAttemptsQuery.isPending,
  reviewTodayCountQuery.data,
  reviewTodayCountQuery.isPending,
  userId,
 ]);
}
