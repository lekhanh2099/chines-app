"use client";

import { isToday } from "date-fns";
import { useMemo } from "react";

import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
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
  const vocabLabels = new Map<string, string>();
  const grammarLabels = new Map<string, string>();
  const radicalLabels = new Map<string, string>();

  for (const catalogLesson of catalog.lessons) {
   for (const word of catalogLesson.vocab) {
    vocabLabels.set(getVocabItemKey(word), word.hanzi);
   }
   for (const point of catalogLesson.grammar) {
    grammarLabels.set(
     point.id,
     point.cleanTitle || point.titleVi || point.title || point.core || point.id,
    );
   }
  }

  for (const radical of catalog.radicals) {
   radicalLabels.set(
    radical.id,
    radical.nameVi ? `${radical.radical} · ${radical.nameVi}` : radical.radical,
   );
  }

  const recentActivity = learning.state.reviewHistory
   .slice(-4)
   .reverse()
   .map((item, index) => ({
    key: `${item.type}:${item.id}:${item.answeredAt}:${index}`,
    label:
     item.type === "vocab"
      ? vocabLabels.get(item.id) || item.id
      : item.type === "grammar"
        ? grammarLabels.get(item.id) || item.id
        : radicalLabels.get(item.id) || item.id,
    kindLabel: item.type === "vocab" ? "Từ vựng" : item.type === "grammar" ? "Ngữ pháp" : "Bộ thủ",
    result: item.result,
    answeredAt: item.answeredAt,
   }));

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
   isLoading: learning.isLoading || recentNotes.isLoading,
  };
 }, [
  catalog.courses,
  catalog.lessons,
  catalog.radicals,
  learning.isLoading,
  learning.state,
  recentNotes.data,
  recentNotes.isLoading,
 ]);
}
