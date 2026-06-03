"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/LessonTextInlineEditor";
import { ModuleSplitWorkspace } from "@/features/hanzihome/components/ModuleSplitWorkspace";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { ReviewWorkspace } from "@/features/hanzihome/components/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 hanzihomeCourseBooks,
 hanzihomeCourses,
 sortLessonsByCourseBookOrder,
} from "@/features/hanzihome/courses/course-catalog";
import {
 getHanziHomeCourseLessonSummaries,
 getHanziHomeLessonDetail,
} from "@/features/hanzihome/static-data";
import type {
 HanziHomeModule,
 LearningStatus,
 ReviewResult,
} from "@/features/hanzihome/types";

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
 return moduleValues.some((item) => item === value)
  ? (value as HanziHomeModule)
  : null;
}

export function HanziHomeWorkspace() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const catalogData = useHanziHomeCatalogData({ includeLessons: false });
 const learning = useLearningState();
 const courseCatalog = useMemo(
  () => ({
   courses: catalogData.courses.length > 0 ? catalogData.courses : hanzihomeCourses,
   books: catalogData.books.length > 0 ? catalogData.books : hanzihomeCourseBooks,
  }),
  [catalogData.books, catalogData.courses],
 );

 const selectedCourseId =
  searchParams.get("courseId") ||
  learning.state.settings.lastCourseId ||
  (courseCatalog.courses?.[0]?.id ?? hanzihomeCourses[0]?.id) ||
  "";

 const courseLessonSummaries = useMemo(
  () => getHanziHomeCourseLessonSummaries(selectedCourseId),
  [selectedCourseId],
 );

 const lessons = useMemo(
  () => sortLessonsByCourseBookOrder(courseLessonSummaries),
  [courseLessonSummaries],
 );

 const courseLessons = useMemo(
  () =>
   lessons.filter(
    (item) =>
     (item.courseId ||
      (courseCatalog.courses?.[0]?.id ?? hanzihomeCourses[0]?.id)) ===
     selectedCourseId,
   ),
  [lessons, courseCatalog.courses, selectedCourseId],
 );

 const lessonIdFromUrl = searchParams.get("lessonId");
 const lastLessonId = learning.state.settings.lastLessonId;
 const lessonIdFromUrlInCourse = courseLessons.some(
  (item) => item.id === lessonIdFromUrl,
 );
 const lastLessonIdInCourse = courseLessons.some(
  (item) => item.id === lastLessonId,
 );

 const fallbackLessonId = courseLessons[0]?.id || "";

 const lessonId =
  (lessonIdFromUrlInCourse ? lessonIdFromUrl : null) ||
  (lastLessonIdInCourse ? lastLessonId : null) ||
  fallbackLessonId;

 const activeModule =
  parseModule(searchParams.get("module")) ||
  learning.state.settings.lastModule ||
  "overview";

 const activeLessonModule: StudyModule =
  activeModule === "radicals" ? "overview" : activeModule;

 const lesson = useMemo(
  () => (activeModule === "radicals" ? null : getHanziHomeLessonDetail(lessonId)),
  [activeModule, lessonId],
 );
 const selectedCourse = courseCatalog.courses.find(
  (course) => course.id === selectedCourseId,
 );

 const replaceWorkspaceParams = (
  updates: Partial<Record<"courseId" | "lessonId" | "module", string>>,
 ) => {
  const nextParams = new URLSearchParams(searchParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
   if (value) nextParams.set(key, value);
   else nextParams.delete(key);
  });

  router.replace(`/hanzihome?${nextParams.toString()}`);
 };

 const selectModule = (nextModule: HanziHomeModule) => {
  replaceWorkspaceParams({ module: nextModule });
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
   markVocab(
    item.id,
    result === "known" ? "known" : result === "hard" ? "hard" : "learning",
   );
  }

  if (item.type === "grammar") {
   markGrammar(
    item.id,
    result === "known" ? "known" : result === "hard" ? "hard" : "learning",
   );
  }
 };

 const activeLessonContent = (() => {
  if (!lesson) return null;

  switch (activeLessonModule) {
   case "overview":
    return (
     <LessonOverview
      lesson={lesson}
      learningState={learning.state}
      onOpenModule={selectModule}
     />
   );
  case "lessonText":
   return <LessonTextInlineEditor lesson={lesson} />;
   case "notes":
    return <LessonNoteAccessCard lesson={lesson} />;
   case "vocab":
    return (
     <VocabWorkspace
      lesson={lesson}
      state={learning.state}
      onBookmark={(id) => learning.toggleBookmark("vocab", id)}
      onMarkStatus={markVocab}
      onOpenReview={() => selectModule("review")}
     />
    );
   case "grammar":
    return (
     <GrammarWorkspace
      lesson={lesson}
      state={learning.state}
      onBookmark={(id) => learning.toggleBookmark("grammar", id)}
      onMarkStatus={markGrammar}
     />
    );
   case "review":
    return (
     <ReviewWorkspace
      lesson={lesson}
      learningState={learning.state}
      onAnswer={answerReview}
      onToggleBookmark={(scope, id) => learning.toggleBookmark(scope, id)}
     />
    );
  }
 })();

 if (!lesson && activeModule !== "radicals") {
  return (
   <main className="hanzihome-static-page">
    <div className="flex w-full max-w-full flex-col gap-2.5">
     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-2.5">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         {selectedCourse?.title || "HanziHome"}
        </p>

        <h1 className="text-2xl font-black text-text-primary">
         Course này chưa có bài học
        </h1>

        <p className="text-sm font-semibold text-text-muted">
         Quay về thư viện học liệu để tạo bài mới hoặc chọn course khác.
        </p>
       </div>

       <Link
        href="/"
        className="w-fit rounded-xl bg-bg-inverse px-4 py-2 text-sm font-black text-text-inverse"
       >
        Về thư viện học liệu
       </Link>
      </div>
     </Card>
    </div>
   </main>
  );
 }

 return (
  <main className="hanzihome-static-page">
   <div className="flex w-full max-w-full flex-col gap-2.5">
    {learning.isSaving && (
     <div className="flex justify-end">
      <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-black text-text-muted">
       Đang lưu...
      </span>
     </div>
    )}

    {activeModule === "radicals" ? (
     <RadicalWorkspace radicals={catalogData.radicals} />
    ) : (
     lesson && (
      <ModuleSplitWorkspace
       key={lesson.id}
       lesson={lesson}
       learningState={learning.state}
       activeModule={activeLessonModule}
       singleContent={activeLessonContent}
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
