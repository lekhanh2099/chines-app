"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { lessonBookKey } from "@/features/hanzihome/utils/learning-state";
import { Typography } from "@/components/ui/typography";
import { ModuleSplitWorkspace } from "@/features/hanzihome/components/ModuleSplitWorkspace";
import { RadicalWorkspaceSkeleton } from "@/features/hanzihome/components/RadicalWorkspaceSkeleton";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { HanziHomeHeaderContextBridge } from "@/features/hanzihome/components/layout/HanziHomeHeaderContextBridge";
import { HanziHomeWorkspaceLoading } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceLoading";
import { HanziHomeWorkspaceMessage } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceMessage";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
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
import { parseHanziHomeModule, resolveLessonModule } from "@/features/hanzihome/workspace-modules";
import type { HanziHomeModule, LearningStatus, ReviewResult } from "@/features/hanzihome/types";
import type { ReviewItem } from "@/features/hanzihome/context/types";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function HanziHomeWorkspace({ forcedModule }: { forcedModule?: HanziHomeModule }) {
 const tSync = useTranslations("Common.syncStatus");
 const router = useRouter();
 const searchParams = useSearchParams();
 const learning = useLearningState();
 const searchNavigationIntent = useHanziHomeSearchNavigationIntent();
 const moduleFromUrl = forcedModule ?? parseHanziHomeModule(searchParams.get("module"));
 const catalogQuery = useHanziHomeCatalogQuery({
  includeLessons: false,
  includeRadicals: moduleFromUrl === "radicals",
 });
 const catalogData = catalogQuery.data;
 const searchParamsString = searchParams.toString();
 const lessonNumberFromUrl = searchParams.get("lesson");
 const legacyLessonIdFromUrl = searchParams.get("lessonId");
 const bookIdFromUrl = searchParams.get("bookId");
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
  refetch: refetchCourseLessons,
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
  bookIdFromUrl,
 );
 const legacyLesson = courseLessons.find((item) => item.id === lastLessonId);
 const selectedBookId = bookIdFromUrl ?? legacyLesson?.bookId ?? courseLessons[0]?.bookId;
 const bookLessons = courseLessons.filter(
  (item) => !selectedBookId || item.bookId === selectedBookId,
 );
 const bookKey = lessonBookKey({ bookId: selectedBookId, courseId: selectedCourseId });
 const resume = learning.state.settings.bookResume?.[bookKey];
 const savedLesson = bookLessons.find((item) => item.id === resume?.lessonId);
 const legacyBookLesson = bookLessons.find((item) => item.id === lastLessonId);
 const hasExplicitLesson = lessonNumberFromUrl !== null || legacyLessonIdFromUrl !== null;
 const selectedLesson =
  lessonFromUrl ??
  (hasExplicitLesson
   ? bookLessons[0]
   : (savedLesson ?? (resume ? undefined : legacyBookLesson) ?? bookLessons[0])) ??
  null;
 const lessonId = selectedLesson?.id || "";
 const matchingSearchIntent =
  searchNavigationIntent &&
  (searchNavigationIntent.lessonId === lessonId ||
   (searchNavigationIntent.courseId === selectedCourseId &&
    searchNavigationIntent.lessonNumber === selectedLesson?.lessonNumber))
   ? searchNavigationIntent
   : null;
 const savedModule =
  resume?.lessonId === selectedLesson?.id ? parseHanziHomeModule(resume?.module) : null;
 const legacyModule =
  legacyBookLesson?.id === selectedLesson?.id ? learning.state.settings.lastModule : null;
 const resolvedActiveModule =
  forcedModule ??
  matchingSearchIntent?.module ??
  moduleFromUrl ??
  (hasExplicitLesson ? "overview" : (savedModule ?? (resume ? null : legacyModule) ?? "overview"));

 useEffect(() => {
  if (learning.isLoading || !selectedLesson || !selectedCourseId) return;
  if (
   learning.state.settings.lastCourseId === selectedCourseId &&
   learning.state.settings.lastLessonId === selectedLesson.id
  ) {
   return;
  }

  learning.updateSettings({
   lastCourseId: selectedCourseId,
   lastLessonId: selectedLesson.id,
  });
 }, [learning, selectedCourseId, selectedLesson]);

 useEffect(() => {
  if (learning.isLoading || !selectedLesson || resolvedActiveModule === "radicals") return;

  const hasCanonicalLesson =
   lessonNumberFromUrl === getLessonRouteValue(selectedLesson.lessonNumber);
  const hasCanonicalBook = !selectedLesson.bookId || bookIdFromUrl === selectedLesson.bookId;
  const hasLegacyLessonId = Boolean(legacyLessonIdFromUrl);

  if (hasCanonicalLesson && hasCanonicalBook && !hasLegacyLessonId) return;

  const nextParams = new URLSearchParams(searchParamsString);
  nextParams.set("courseId", selectedCourseId);
  if (selectedLesson.bookId) nextParams.set("bookId", selectedLesson.bookId);
  else nextParams.delete("bookId");
  nextParams.set("lesson", getLessonRouteValue(selectedLesson.lessonNumber));
  nextParams.delete("lessonId");
  nextParams.set("module", resolvedActiveModule);
  router.replace(`/hanzihome?${nextParams.toString()}`);
 }, [
  learning.isLoading,
  resolvedActiveModule,
  bookIdFromUrl,
  legacyLessonIdFromUrl,
  lessonNumberFromUrl,
  router,
  searchParamsString,
  selectedCourseId,
  selectedLesson,
 ]);

 const isListeningLesson = selectedLesson?.tags?.includes("listening") ?? false;
 const activeLessonModule = resolveLessonModule({
  requestedModule: resolvedActiveModule,
  isListeningLesson,
 });

 useEffect(() => {
  if (learning.isLoading || !selectedLesson || resolvedActiveModule === "radicals") return;
  const key = lessonBookKey(selectedLesson);
  const current = learning.state.settings.bookResume?.[key];
  if (current?.lessonId === selectedLesson.id && current.module === activeLessonModule) return;
  learning.updateSettings({
   bookResume: { [key]: { lessonId: selectedLesson.id, module: activeLessonModule } },
  });
 }, [learning, selectedLesson, activeLessonModule, resolvedActiveModule]);

 const activeLessonDetail = useHanziHomeLesson(lessonId);
 const lesson = resolvedActiveModule === "radicals" ? null : activeLessonDetail.lesson;
 const selectedCourse = courseCatalog.courses.find((course) => course.id === selectedCourseId);

 const selectModule = (nextModule: HanziHomeModule) => {
  clearHanziHomeSearchNavigationIntent();
  learning.updateSettings({ lastModule: nextModule });

  if (nextModule === "radicals") {
   router.push("/radicals");
   return;
  }

  const nextParams = new URLSearchParams(searchParamsString);
  nextParams.set("courseId", selectedCourseId);
  if (selectedLesson?.bookId) nextParams.set("bookId", selectedLesson.bookId);
  else nextParams.delete("bookId");
  if (selectedLesson) {
   nextParams.set("lesson", getLessonRouteValue(selectedLesson.lessonNumber));
  }
  nextParams.delete("lessonId");
  nextParams.set("module", nextModule);
  router.push(`/hanzihome?${nextParams.toString()}`, { scroll: false });
 };

 const markVocab = (id: string, status: LearningStatus) => {
  learning.updateVocabProgress(id, status);
 };

 const markGrammar = (id: string, status: LearningStatus) => {
  learning.updateGrammarProgress(id, status);
 };

 const answerReview = (item: ReviewItem, result: ReviewResult) => {
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
 const isRadicalsLoading = resolvedActiveModule === "radicals" && catalogQuery.isPending;
 const hasLessonWorkspaceError =
  resolvedActiveModule !== "radicals" &&
  (catalogQuery.isError ||
   isCourseLessonsError ||
   activeLessonDetail.isError ||
   (!isCourseLessonsLoading && !selectedCourse));

 if (catalogQuery.isError || hasLessonWorkspaceError) {
  const isOffline = !learning.isOnline;
  return (
   <HanziHomeWorkspaceMessage
    eyebrow={selectedCourse?.title || "HanziHome"}
    title={isOffline ? tSync("offlineUnavailableTitle") : "Không tải được bài học"}
    description={
     isOffline
      ? tSync("offlineUnavailableDescription")
      : "Dữ liệu bài học hiện không khả dụng. Thử tải lại trang hoặc quay về thư viện."
    }
    showLibraryLink
    onRetry={() => {
     void Promise.all([
      catalogQuery.refetch(),
      refetchCourseLessons(),
      activeLessonDetail.refetch(),
     ]);
    }}
   />
  );
 }

 if (learning.isLoading || isLessonWorkspaceLoading) return <HanziHomeWorkspaceLoading />;
 if (isRadicalsLoading) return <RadicalWorkspaceSkeleton />;

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
  <>
   {resolvedActiveModule !== "radicals" && selectedCourse && selectedLesson ? (
    <HanziHomeHeaderContextBridge
     selectedCourseId={selectedCourseId}
     selectedCourseTitle={selectedCourse.title}
     selectedLesson={selectedLesson}
     lessons={courseLessons}
    />
   ) : null}
   <div className="hanzihome-static-page hanzihome-workspace-page">
    <Typography as="h1" variant="pageTitle" className="sr-only">
     {resolvedActiveModule === "radicals"
      ? "Bộ thủ HanziHome"
      : lesson
        ? `Bài học ${lesson.title}`
        : "Không gian học HanziHome"}
    </Typography>
    <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
     {resolvedActiveModule === "radicals" ? (
      <RadicalWorkspace
       key={matchingSearchIntent?.id ?? "radicals"}
       radicals={catalogData?.radicals ?? []}
      />
     ) : (
      lesson && (
       <ModuleSplitWorkspace
        key={`${lesson.id}:${matchingSearchIntent?.id ?? "default"}`}
        readOnly={false}
        lesson={lesson}
        learningState={learning.state}
        learningSync={{
         status: learning.syncStatus,
         durability: learning.durability,
         pendingCount: learning.pendingSyncCount,
         lastError: learning.lastSyncError,
         isOnline: learning.isOnline,
         retry: learning.retrySync,
        }}
        activeModule={activeLessonModule}
        onSelectModule={selectModule}
        onUpdateLearningSettings={learning.updateSettings}
        onBookmarkVocab={(id) => learning.toggleBookmark("vocab", id)}
        onMarkVocab={markVocab}
        onBookmarkGrammar={(id) => learning.toggleBookmark("grammar", id)}
        onMarkGrammar={markGrammar}
        onAnswerReview={answerReview}
       />
      )
     )}
    </div>
   </div>
  </>
 );
}
