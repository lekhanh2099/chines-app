"use client";

import { useMemo } from "react";

import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { useRecentNotes } from "@/features/notes/hooks/useRecentNotes";
import type { HomeDashboardModel } from "@/features/home/types";

export function useHomeDashboard(): HomeDashboardModel {
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const learning = useLearningState();
 const recentNotes = useRecentNotes(3);

 return useMemo(() => {
  const lastLessonId = learning.state.settings.lastLessonId;
  const recentLesson = catalog.lessons.find((lesson) => lesson.id === lastLessonId);
  const fallbackLesson = catalog.lessons[0] ?? null;
  const lesson = recentLesson ?? fallbackLesson;
  const course = lesson ? catalog.courses.find((item) => item.id === lesson.courseId) : null;
  const lastModule = learning.state.settings.lastModule ?? "overview";

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
   recentNotes: recentNotes.data ?? [],
   isLoading: learning.isLoading || recentNotes.isLoading,
  };
 }, [
  catalog.courses,
  catalog.lessons,
  learning.isLoading,
  learning.state.settings,
  recentNotes.data,
  recentNotes.isLoading,
 ]);
}
