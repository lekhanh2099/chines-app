"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
import { useRouter } from "@/i18n/navigation";

export function HanziHomeWorkspace({ forcedModule }: { forcedModule?: HanziHomeModule }) {
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
 const resolvedActiveModule = forcedModule ?? matchingSearchIntent?.module ?? activeModule;

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
  if (!selectedLesson || resolvedActiveModule === "radicals") return;

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
  router.replace(`/hanzihome?${nextParams.toString()}`);
 }, [
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

 const activeLessonDetail = useHanziHomeLesson(lessonId);
 const lesson = resolvedActiveModule === "radicals" ? null : activeLessonDetail.lesson;
 const selectedCourse = courseCatalog.courses.find((course) => course.id === selectedCourseId);

 const selectModule = (nextModule: HanziHomeModule) => {
  clearHanziHomeSearchNavigationIntent();
  setActiveModule(nextModule);
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
  router.replace(`/hanzihome?${nextParams.toString()}`, { scroll: false });
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

 if (isLessonWorkspaceLoading) return <HanziHomeWorkspaceLoading />;
 if (isRadicalsLoading) return <RadicalWorkspaceSkeleton />;

 if (catalogQuery.isError || hasLessonWorkspaceError) {
  return (
   <HanziHomeWorkspaceMessage
    eyebrow={selectedCourse?.title || "HanziHome"}
    title="Không tải được bài học"
    description="Dữ liệu bài học hiện không khả dụng. Thử tải lại trang hoặc quay về thư viện."
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
       radicals={catalogData.radicals}
      />
     ) : (
      lesson && (
       <ModuleSplitWorkspace
        key={`${lesson.id}:${matchingSearchIntent?.id ?? "default"}`}
        lesson={lesson}
        learningState={learning.state}
        learningSync={{
         status: learning.syncStatus,
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
