"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";

import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import { GlobalSearchDialog } from "@/features/hanzihome/search/GlobalSearchDialog";
import {
 clearHanziHomeSearchNavigationIntent,
 setHanziHomeSearchNavigationIntent,
} from "@/features/hanzihome/search/searchNavigationStore";
import type { HanziHomeSearchIndexItem } from "@/features/hanzihome/search/types";
import { findLessonByRouteParam } from "@/features/hanzihome/utils/lesson-route";
import { usePathname, useRouter } from "@/i18n/navigation";
import { containsChinese } from "@/lib/chinese-utils";
import { focusModeStore } from "@/stores/focus-mode-store";
import { globalSearchStore } from "@/stores/global-search-store";

export function HanziHomeGlobalSearchBridge() {
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const open = useSelector(globalSearchStore, (state) => state.open);
 const query = useSelector(globalSearchStore, (state) => state.query);
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { openInspector } = useVocabInspector();
 const isLessonWorkspace =
  pathname === "/hanzihome" &&
  (searchParams.has("courseId") ||
   searchParams.has("lesson") ||
   searchParams.has("lessonId") ||
   searchParams.has("module"));
 const catalog = useHanziHomeCatalogData({ enabled: isLessonWorkspace });
 const selectedCourseId =
  isLessonWorkspace && catalog.courses.length > 0
   ? searchParams.get("courseId") || catalog.courses[0]?.id || ""
   : "";
 const courseLessonsQuery = useHanziHomeCourseLessons(selectedCourseId, {
  enabled: isLessonWorkspace && Boolean(selectedCourseId),
 });
 const selectedLesson = useMemo(() => {
  if (!isLessonWorkspace) return null;

  return (
   findLessonByRouteParam(
    courseLessonsQuery.lessons,
    searchParams.get("lesson"),
    searchParams.get("lessonId"),
    searchParams.get("bookId"),
   ) ??
   courseLessonsQuery.lessons[0] ??
   null
  );
 }, [courseLessonsQuery.lessons, isLessonWorkspace, searchParams]);

 const closeAndClear = () => {
  globalSearchStore.actions.closeSearch();
  globalSearchStore.actions.clearQuery();
 };

 const handleDirectLookup = (value: string) => {
  const trimmed = value.trim();
  if (!containsChinese(trimmed)) return;

  openInspector(trimmed);
  closeAndClear();
 };

 const handleOpenSearchResult = (item: HanziHomeSearchIndexItem) => {
  if (focusModeEnabled && item.lessonId && item.lessonId !== selectedLesson?.id) {
   toast.warning("Focus mode đang bật. Không thể chuyển sang bài khác.");
   return;
  }

  clearHanziHomeSearchNavigationIntent();
  if (item.module || item.targetId) {
   setHanziHomeSearchNavigationIntent({
    courseId: item.courseId,
    lessonId: item.lessonId,
    lessonNumber: item.lessonNumber,
    module: item.module,
    targetId: item.targetId,
   });
  }

  if (item.href) router.push(item.href);
  closeAndClear();
 };

 return (
  <GlobalSearchDialog
   open={open}
   query={query}
   courseId={selectedCourseId || undefined}
   lessonId={selectedLesson?.id}
   onOpenChange={globalSearchStore.actions.setOpen}
   onQueryChange={globalSearchStore.actions.setQuery}
   onOpenResult={handleOpenSearchResult}
   onDirectLookup={handleDirectLookup}
  />
 );
}
