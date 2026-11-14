"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type SegmentedControlItem } from "@/components/ui/forms/segmented-control";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { dictationSourcesFromTextbook } from "@/features/hanzihome/practice/translation-practice";
import { buildTextbookHref } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import {
 getTextbookCatalogForBookKeys,
 getTextbookLesson,
 type TextbookBookSummary,
 type TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { defaultTextbookDisplaySettings } from "@/features/hanzihome/utils/learning-state";
import { parseReaderSourceTarget } from "@/features/reading/model/reading-source-target";
import { usePathname, useRouter as useLocalizedRouter } from "@/i18n/navigation";
import {
 businessChineseContentSections,
 businessChineseTabAvailable,
} from "./business-chinese-study-utils";

/**
 * Resolves the lesson/book from the route and query string synchronously (no
 * loading state when switching in place), and owns the active tab URL state.
 */
export function useBusinessChineseLessonView({
 books: initialBooks,
 lesson: initialLesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const searchParams = useSearchParams();
 const sourceTarget = parseReaderSourceTarget(new URLSearchParams(searchParams.toString()));
 const router = useLocalizedRouter();
 const learning = useLearningState();
 const learningState = learning.state;
 const { toggleBookmark } = learning;

 const currentPath = usePathname();
 const detectedBookKey: TextbookLesson["bookKey"] = currentPath.includes("/khau-ngu-tc1")
  ? "khau-ngu"
  : currentPath.includes("/doc-hieu")
    ? "doc-hieu"
    : currentPath.includes("/han-thuong-mai")
      ? "tm3"
      : currentPath.includes("/nhip-cau")
        ? "nhip-cau"
        : initialLesson.bookKey;

 const requestedLessonNumber =
  typeof searchParams.get("lesson") === "string" ? Number(searchParams.get("lesson")) : null;

 const lesson = useMemo(() => {
  const targetNumber =
   requestedLessonNumber && Number.isInteger(requestedLessonNumber)
    ? requestedLessonNumber
    : detectedBookKey !== initialLesson.bookKey
      ? 1
      : initialLesson.number;

  if (detectedBookKey !== initialLesson.bookKey || targetNumber !== initialLesson.number) {
   const resolved = getTextbookLesson(detectedBookKey, targetNumber);
   if (resolved) return resolved;
  }
  return initialLesson;
 }, [detectedBookKey, initialLesson, requestedLessonNumber]);

 const books = useMemo(() => {
  if (initialBooks.some((b) => b.key === lesson.bookKey)) return initialBooks;
  return getTextbookCatalogForBookKeys([lesson.bookKey]);
 }, [initialBooks, lesson.bookKey]);

 const book = books.find((item) => item.key === lesson.bookKey);
 const bookKey = `static:${book?.id ?? lesson.bookKey}`;
 const resume = learningState.settings.bookResume?.[bookKey];
 const resumeLesson = book?.lessons.find((item) => item.id === resume?.lessonId);
 const shouldRestoreLesson =
  !searchParams.has("lesson") &&
  !learning.isLoading &&
  Boolean(resumeLesson && resumeLesson.id !== lesson.id);
 const globalPinyin = learningState.settings.lessonTextDisplayMode?.showPinyin;
 const bookDisplay = learningState.settings.bookDisplayModes?.[bookKey];
 const displayMode: LessonDisplayMode = useMemo(
  () => ({
   ...defaultTextbookDisplaySettings,
   ...(bookDisplay ?? {}),
   ...(bookDisplay?.showPinyin === undefined && globalPinyin !== undefined
    ? { showPinyin: globalPinyin }
    : {}),
  }),
  [bookDisplay, globalPinyin],
 );
 const isLessonBookmarked = (learningState.bookmarks.lessons ?? []).includes(lesson.id);
 const lastBookmarkClickRef = useRef(0);
 const handleToggleCurrentLessonBookmark = useCallback(() => {
  const now = Date.now();
  if (now - lastBookmarkClickRef.current < 400) return;
  lastBookmarkClickRef.current = now;
  toggleBookmark("lessons", lesson.id);
 }, [lesson.id, toggleBookmark]);

 const contentSections = useMemo(
  () => businessChineseContentSections(lesson.sections),
  [lesson.sections],
 );

 const dictationSources = useMemo(() => dictationSourcesFromTextbook(lesson), [lesson]);

 const tabs = useMemo<SegmentedControlItem<string>[]>(
  () =>
   [
    { key: "all", label: t("tabs.all") },
    { key: "overview", label: t("tabs.overview") },
    { key: "core", label: t("tabs.core") },
    { key: "text", label: t("tabs.text") },
    { key: "notes", label: t("tabs.notes") },
    { key: "translation", label: t("tabs.translation") },
    { key: "dictation", label: t("tabs.dictation") },
    { key: "vocab", label: t("tabs.vocab") },
    { key: "review", label: t("tabs.review") },
    { key: "grammar", label: t("tabs.grammar") },
    { key: "practice", label: t("tabs.practice") },
   ].filter((tab) =>
    businessChineseTabAvailable(
     tab.key,
     contentSections,
     dictationSources.length,
     lesson.vocab.length,
    ),
   ),
  [contentSections, dictationSources.length, lesson.vocab.length, t],
 );

 const [optimisticTab, setOptimisticTab] = useState<string | null>(null);
 const activeTabParam = optimisticTab ?? searchParams.get("tab");
 const requestedView =
  activeTabParam ??
  (sourceTarget?.documentId === `${lesson.id}:text`
   ? "text"
   : !searchParams.has("lesson") && resume?.lessonId === lesson.id
     ? resume.module
     : "all");
 const activeView = tabs.find((item) => item.key === requestedView)?.key ?? "all";
 const setActiveView = useCallback(
  (value: string) => {
   setOptimisticTab(value);
   const params = new URLSearchParams(searchParams.toString());
   params.set("lesson", String(lesson.number));
   params.set("tab", value);
   if (currentPath.endsWith("/offline")) {
    window.history.pushState(null, "", `?${params.toString()}`);
    return;
   }
   router.push(`${buildTextbookHref(lesson.bookKey, lesson.number).split("?")[0]}?${params}`, {
    scroll: false,
   });
  },
  [currentPath, lesson.bookKey, lesson.number, router, searchParams],
 );

 return {
  searchParams,
  router,
  learning,
  currentPath,
  lesson,
  books,
  bookKey,
  resume,
  resumeLesson,
  shouldRestoreLesson,
  displayMode,
  isLessonBookmarked,
  handleToggleCurrentLessonBookmark,
  tabs,
  activeView,
  setActiveView,
 };
}

export type BusinessChineseLessonView = ReturnType<typeof useBusinessChineseLessonView>;

/** Tracks whether the viewport is wide enough (80rem) for the in-layout toolbar. */
export function useBusinessChineseWideToolbar() {
 const [hasWideToolbar, setHasWideToolbar] = useState(false);
 useEffect(() => {
  const query = window.matchMedia("(min-width: 80rem)");
  const updateToolbar = () => setHasWideToolbar(query.matches);
  updateToolbar();
  query.addEventListener("change", updateToolbar);
  return () => query.removeEventListener("change", updateToolbar);
 }, []);
 return hasWideToolbar;
}

/** Restores the saved lesson for a book, otherwise persists the current lesson/tab. */
export function useBusinessChineseLessonResume({
 learning,
 shouldRestoreLesson,
 resumeLesson,
 resume,
 router,
 lesson,
 activeView,
 bookKey,
 searchParams,
 currentPath,
}: BusinessChineseLessonView) {
 useEffect(() => {
  if (learning.isLoading) return;
  if (shouldRestoreLesson && resumeLesson) {
   if (currentPath.endsWith("/offline")) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lesson", String(resumeLesson.number));
    params.set("tab", searchParams.get("tab") ?? resume?.module ?? "all");
    window.history.replaceState(null, "", `?${params.toString()}`);
    return;
   }
   router.replace(
    `${buildTextbookHref(lesson.bookKey, resumeLesson.number)}&tab=${encodeURIComponent(searchParams.get("tab") ?? resume?.module ?? "all")}`,
   );
   return;
  }
  if (resume?.lessonId !== lesson.id || resume.module !== activeView) {
   learning.updateSettings({
    bookResume: { [bookKey]: { lessonId: lesson.id, module: activeView } },
   });
  }
 }, [
  learning,
  shouldRestoreLesson,
  resumeLesson,
  resume,
  router,
  lesson,
  activeView,
  bookKey,
  searchParams,
  currentPath,
 ]);
}
