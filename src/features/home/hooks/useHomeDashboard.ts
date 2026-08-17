"use client";

import { isToday } from "date-fns";
import { useMemo } from "react";

import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { useRecentNotes } from "@/features/notes/hooks/useRecentNotes";
import { buildHomeRecentActivity } from "@/features/home/home-dashboard.utils";
import type { HomeDashboardModel } from "@/features/home/types";

export function useHomeDashboard(): HomeDashboardModel {
 const catalogQuery = useHanziHomeCatalogQuery({ includeLessons: true });
 const catalog = catalogQuery.data;
 const learning = useLearningState();
 const recentNotes = useRecentNotes(3);

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
  const reviewedTodayCount = learning.state.reviewHistory.filter((item) =>
   isToday(new Date(item.answeredAt)),
  ).length;
  const bookmarkedCount = Object.values(learning.state.bookmarks).reduce(
   (total, items) => total + (items?.length ?? 0),
   0,
  );
  const recentActivity = buildHomeRecentActivity(learning.state.reviewHistory);

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
   },
   recentActivity,
   recentNotes: recentNotes.data ?? [],
   isLoading: catalogQuery.isPending || learning.isLoading || recentNotes.isLoading,
  };
 }, [
  catalog.courses,
  catalog.lessons,
  catalogQuery.isPending,
  learning.isLoading,
  learning.state,
  recentNotes.data,
  recentNotes.isLoading,
 ]);
}
