"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ModuleSplitWorkspace } from "@/features/hanzihome/components/ModuleSplitWorkspace";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { HanziHomeWorkspaceLoading } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceLoading";
import { HanziHomeWorkspaceMessage } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceMessage";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import { useHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLesson";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 clearHanziHomeSearchNavigationIntent,
 useHanziHomeSearchNavigationIntent,
} from "@/features/hanzihome/search/searchNavigationStore";
import { sortLessonsByCourseBookOrder } from "@/features/hanzihome/courses/course-catalog";
import {
 findLessonByRouteParam,
 getLessonRouteValue,
} from "@/features/hanzihome/utils/lesson-route";
import type { HanziHomeModule, LearningStatus, ReviewResult } from "@/features/hanzihome/types";

type StudyModule = Exclude<HanziHomeModule, "radicals">;

const moduleValues = [
 "overview",
 "lessonText",
 "notes",
 "vocab",
 "grammar",
 "review",
 "radicals",
] as const;

function parseModule(value: string | null | undefined): HanziHomeModule | null {
 return moduleValues.some((item) => item === value) ? (value as HanziHomeModule) : null;
}

export function HanziHomeWorkspace() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const catalogData = useHanziHomeCatalogData({ includeLessons: false });
 const learning = useLearningState();
 const searchNavigationIntent = useHanziHomeSearchNavigationIntent();
 const moduleFromUrl = parseModule(searchParams.get("module"));
 const searchParamsString = searchParams.toString();
 const lessonNumberFromUrl = searchParams.get("lesson");
 const legacyLessonIdFromUrl = searchParams.get("lessonId");
 const [activeModule, setActiveModule] = useState<HanziHomeModule>(
  () => moduleFromUrl || learning.state.settings.lastModule || "overview",
 );
 const courseCatalog = useMemo(
  () => ({
   courses: catalogData.courses,
   books: catalogData.books,
  }),
  [catalogData.books, catalogData.courses],
 );

 const selectedCourseId =
  searchParams.get("courseId") ||
  learning.state.settings.lastCourseId ||
  courseCatalog.courses[0]?.id ||
  "";

 const {
  lessons: courseLessonSummaries,
  isLoading: isCourseLessonsLoading,
  isError: isCourseLessonsError,
 } = useHanziHomeCourseLessons(selectedCourseId);

 const lessons = useMemo(
  () => sortLessonsByCourseBookOrder(courseLessonSummaries),
  [courseLessonSummaries],
 );

 const courseLessons = useMemo(
  () => lessons.filter((item) => item.courseId === selectedCourseId),
  [lessons, selectedCourseId],
 );

 const lastLessonId = learning.state.settings.lastLessonId;
 const lessonFromUrl = findLessonByRouteParam(
  courseLessons,
  lessonNumberFromUrl,
  legacyLessonIdFromUrl,
 );
 const lessonFromLastState = courseLessons.find((item) => item.id === lastLessonId);

 const fallbackLesson = courseLessons[0] ?? null;

 const selectedLesson = lessonFromUrl || lessonFromLastState || fallbackLesson;
 const lessonId = selectedLesson?.id || "";
 const matchingSearchIntent =
  searchNavigationIntent &&
  (searchNavigationIntent.lessonId === lessonId ||
   (searchNavigationIntent.courseId === selectedCourseId &&
    searchNavigationIntent.lessonNumber === selectedLesson?.lessonNumber))
   ? searchNavigationIntent
   : null;
 const resolvedActiveModule = matchingSearchIntent?.module ?? activeModule;

 useEffect(() => {
  if (!selectedLesson || resolvedActiveModule === "radicals") return;

  const hasCanonicalLesson =
   lessonNumberFromUrl === getLessonRouteValue(selectedLesson.lessonNumber);
  const hasLegacyLessonId = Boolean(legacyLessonIdFromUrl);

  if (hasCanonicalLesson && !hasLegacyLessonId) return;

  const nextParams = new URLSearchParams(searchParamsString);
  nextParams.set("courseId", selectedCourseId);
  nextParams.set("lesson", getLessonRouteValue(selectedLesson.lessonNumber));
  nextParams.delete("lessonId");
  router.replace(`/hanzihome?${nextParams.toString()}`);
 }, [
  resolvedActiveModule,
  legacyLessonIdFromUrl,
  lessonNumberFromUrl,
  router,
  searchParamsString,
  selectedCourseId,
  selectedLesson,
 ]);

 const activeLessonModule: StudyModule =
  resolvedActiveModule === "radicals" ? "overview" : resolvedActiveModule;

 const activeLessonDetail = useHanziHomeLesson(lessonId);
 const lesson = resolvedActiveModule === "radicals" ? null : activeLessonDetail.lesson;
 const selectedCourse = courseCatalog.courses.find((course) => course.id === selectedCourseId);

 const selectModule = (nextModule: HanziHomeModule) => {
  clearHanziHomeSearchNavigationIntent();
  setActiveModule(nextModule);
  learning.updateSettings({ lastModule: nextModule });
 };

 const markVocab = (id: string, status: LearningStatus) => {
  learning.updateVocabProgress(id, status);
 };

 const markGrammar = (id: string, status: LearningStatus) => {
  learning.updateGrammarProgress(id, status);
 };

 const answerReview = (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => {
  learning.appendReviewHistory(item, result);

  if (item.type === "vocab") {
   markVocab(item.id, result === "known" ? "known" : result === "hard" ? "hard" : "learning");
  }

  if (item.type === "grammar") {
   markGrammar(item.id, result === "known" ? "known" : result === "hard" ? "hard" : "learning");
  }
 };

 const isLessonWorkspaceLoading =
  resolvedActiveModule !== "radicals" && (isCourseLessonsLoading || activeLessonDetail.isLoading);

 const hasLessonWorkspaceError =
  resolvedActiveModule !== "radicals" &&
  (isCourseLessonsError ||
   activeLessonDetail.isError ||
   (!isCourseLessonsLoading && !selectedCourse));

 if (isLessonWorkspaceLoading) {
  return <HanziHomeWorkspaceLoading />;
 }

 if (hasLessonWorkspaceError) {
  return (
   <HanziHomeWorkspaceMessage
    eyebrow={selectedCourse?.title || "HanziHome"}
    title="Không tải được bài học"
    description="Dữ liệu bài học hiện không khả dụng. Thử tải lại trang hoặc quay về thư viện."
   />
  );
 }

 if (!lesson && resolvedActiveModule !== "radicals") {
  return (
   <HanziHomeWorkspaceMessage
    eyebrow={selectedCourse?.title || "HanziHome"}
    title="Course này chưa có bài học"
    description="Quay về thư viện học liệu để chọn course khác."
    showLibraryLink
   />
  );
 }

 return (
  <main className="hanzihome-static-page">
   <div className="flex w-full max-w-full flex-col gap-2.5">
    {resolvedActiveModule === "radicals" ? (
     <RadicalWorkspace
      key={matchingSearchIntent?.id ?? "radicals"}
      radicals={catalogData.radicals}
     />
    ) : (
     lesson && (
      <ModuleSplitWorkspace
       key={`${lesson.id}:${matchingSearchIntent?.id ?? "default"}`}
       lesson={lesson}
       learningState={learning.state}
       activeModule={activeLessonModule}
       onSelectModule={selectModule}
       onBookmarkVocab={(id) => learning.toggleBookmark("vocab", id)}
       onMarkVocab={markVocab}
       onBookmarkGrammar={(id) => learning.toggleBookmark("grammar", id)}
       onMarkGrammar={markGrammar}
       onAnswerReview={answerReview}
      />
     )
    )}
   </div>
  </main>
 );
}
