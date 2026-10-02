"use client";

import { useQuery } from "@tanstack/react-query";
import { startOfToday } from "date-fns";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

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
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { buildHomeCourseGroups } from "@/features/home/home-dashboard.utils";
import { buildHomeRecentActivity } from "@/features/home/home-dashboard.utils";
import type { HomeDashboardModel } from "@/features/home/types";

export function useHomeDashboard(textbooks: TextbookBookSummary[]): HomeDashboardModel {
 const t = useTranslations("Home");
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
 });
 const reviewAttemptsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.practiceAttemptsRecent(userId, "review"),
  enabled: isResolved && userId !== null,
  queryFn: () =>
   userId ? fetchRecentPracticeAttempts({ surface: "review", limit: 50 }) : Promise.resolve([]),
  staleTime: 30_000,
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
 });

 return useMemo(() => {
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
  const recentActivity = buildHomeRecentActivity(attempts, {
   fallback: {
    vocab: t("activity.fallbackLabels.vocab"),
    grammar: t("activity.fallbackLabels.grammar"),
    radical: t("activity.fallbackLabels.radical"),
   },
   kind: {
    vocab: t("activity.kinds.vocab"),
    grammar: t("activity.kinds.grammar"),
    radical: t("activity.kinds.radical"),
   },
  });

  return {
   courses: buildHomeCourseGroups(catalog, textbooks, learning.state.settings),
   catalogUnavailable: catalogQuery.isError,
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
  textbooks,
  catalog,
  catalogQuery.isError,
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
  t,
 ]);
}
