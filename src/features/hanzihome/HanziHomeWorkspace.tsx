"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
 BookOpen,
 GraduationCap,
 Home,
 Layers3,
 RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SegmentedControlItem } from "@/components/ui/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { CoursePicker } from "@/features/hanzihome/components/CoursePicker";
import { LessonPicker } from "@/features/hanzihome/components/LessonPicker";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { ReviewWorkspace } from "@/features/hanzihome/components/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import {
 CreateLessonDraftDialog,
 LessonDraftsCompactList,
 mapLessonDraftToHanziHomeLesson,
 useLessonDraftsQuery,
} from "@/features/hanzihome/lesson-drafts";
import { useHanziHomeData } from "@/features/hanzihome/hooks/useHanziHomeData";
import { useHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLesson";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 hanzihomeCourseBooks,
 hanzihomeCourses,
 sortLessonsByCourseBookOrder,
} from "@/features/hanzihome/courses/course-catalog";
import type {
 HanziHomeData,
 HanziHomeModule,
 LearningStatus,
 ReviewResult,
} from "@/features/hanzihome/types";
import { BookLessonSummary } from "@/features/hanzihome/components/BookLessonSummary";

const tabs = [
 { key: "overview" as const, label: "Tổng quan", icon: Home },
 { key: "vocab" as const, label: "Từ vựng", icon: BookOpen },
 { key: "grammar" as const, label: "Ngữ pháp", icon: GraduationCap },
 { key: "review" as const, label: "Ôn tập", icon: RotateCcw },
] satisfies SegmentedControlItem<Exclude<HanziHomeModule, "radicals">>[];

const moduleValues = [
 "overview",
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
 const staticData = useHanziHomeData();
 const draftsQuery = useLessonDraftsQuery();
 const learning = useLearningState();

 const publishedDraftLessons = useMemo(
  () =>
   (draftsQuery.data ?? [])
    .filter((draft) => draft.status === "published")
    .map(mapLessonDraftToHanziHomeLesson),
  [draftsQuery.data],
 );

 const data = useMemo<HanziHomeData>(
  () => ({
   ...staticData,
   courses: staticData.courses ?? hanzihomeCourses,
   books: staticData.books ?? hanzihomeCourseBooks,
   lessons: sortLessonsByCourseBookOrder([
    ...staticData.lessons,
    ...publishedDraftLessons,
   ]),
  }),
  [publishedDraftLessons, staticData],
 );

 const selectedCourseId =
  searchParams.get("courseId") ||
  learning.state.settings.lastCourseId ||
  (data.courses?.[0]?.id ?? hanzihomeCourses[0]?.id) ||
  "";

 const courseLessons = useMemo(
  () =>
   data.lessons.filter(
    (item) =>
     (item.courseId || (data.courses?.[0]?.id ?? hanzihomeCourses[0]?.id)) ===
     selectedCourseId,
   ),
  [data.courses, data.lessons, selectedCourseId],
 );

 const courseBooks = useMemo(
  () => data.books.filter((book) => book.courseId === selectedCourseId),
  [data.books, selectedCourseId],
 );

 const lessonId =
  searchParams.get("lessonId") ||
  learning.state.settings.lastLessonId ||
  courseLessons[0]?.id ||
  data.lessons[0]?.id ||
  "";

 const activeModule =
  parseModule(searchParams.get("module")) ||
  learning.state.settings.lastModule ||
  "overview";

 const activeLessonModule =
  activeModule === "radicals" ? "overview" : activeModule;

 const lesson = useHanziHomeLesson(data, lessonId);
 const selectedLessonId = lesson?.id || lessonId;

 const selectedBookId =
  lesson?.bookId || courseLessons[0]?.bookId || courseBooks[0]?.id;
 const subtitle = useMemo(() => {
  if (!lesson) return "Không có dữ liệu bài học.";
  return `${lesson.vocab.length} từ · ${lesson.grammar.length} điểm ngữ pháp`;
 }, [lesson]);

 const suggestedDraftLessonNumber = useMemo(() => {
  const lessonNumbers = courseLessons
   .map((item) => item.lessonNumber)
   .filter((value): value is number => typeof value === "number");

  return lessonNumbers.length > 0 ? Math.max(...lessonNumbers) + 1 : 1;
 }, [courseLessons]);

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

 const selectCourse = (nextCourseId: string) => {
  const firstLessonInCourse =
   data.lessons.find((item) => item.courseId === nextCourseId) ||
   data.lessons[0];

  replaceWorkspaceParams({
   courseId: nextCourseId,
   lessonId: firstLessonInCourse?.id,
   module: activeModule === "radicals" ? "overview" : activeModule,
  });

  learning.updateSettings({
   lastCourseId: nextCourseId,
   lastLessonId: firstLessonInCourse?.id,
  });
 };

 const selectLesson = (nextLessonId: string) => {
  replaceWorkspaceParams({ lessonId: nextLessonId });
  learning.updateSettings({ lastLessonId: nextLessonId });
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

 if (!lesson && activeModule !== "radicals") {
  return (
   <main className="hanzihome-static-page">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
     <Card padding="lg" className="rounded-2xl">
      <div className="grid gap-3">
       <p className="text-sm font-semibold text-text-muted">
        Không tìm thấy dữ liệu bài học.
       </p>

       <Button type="button" onClick={() => selectModule("radicals")}>
        <Layers3 className="h-4 w-4" />
        Mở thư viện bộ thủ
       </Button>
      </div>
     </Card>
    </div>
   </main>
  );
 }

 return (
  <main className="hanzihome-static-page">
   <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
    <Card padding="md" className="rounded-2xl">
     <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide">
        {activeModule === "radicals"
         ? "HanziHome / Bộ thủ"
         : lesson?.courseTitle || "HanziHome / Course"}
       </p>

       <h1 className="mt-1 truncate text-2xl font-black tracking-normal text-text-primary sm:text-3xl">
        {activeModule === "radicals" ? "Thư viện bộ thủ" : lesson?.title}
       </h1>

       <p className="mt-1 text-sm font-bold text-text-muted">
        {activeModule === "radicals"
         ? `${data.radicals.length} bộ thủ từ JSON tĩnh`
         : subtitle}
       </p>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(14rem,0.9fr)_minmax(16rem,1fr)_auto_auto_auto] sm:items-end">
       {activeModule !== "radicals" && lesson && (
        <>
         <CoursePicker
          courses={data.courses}
          selectedCourseId={selectedCourseId}
          onSelectCourse={selectCourse}
         />

         <LessonPicker
          lessons={courseLessons}
          selectedLessonId={selectedLessonId}
          onSelectLesson={selectLesson}
         />

         <Button onClick={() => selectModule("review")}>
          <RotateCcw className="h-4 w-4" />
          Ôn nhanh
         </Button>

         <CreateLessonDraftDialog
          suggestedLessonNumber={suggestedDraftLessonNumber}
          courses={data.courses}
          books={data.books}
          selectedCourseId={selectedCourseId}
          selectedBookId={selectedBookId}
         />
        </>
       )}

       {activeModule === "radicals" ? (
        <Button onClick={() => selectModule("overview")}>
         <BookOpen className="h-4 w-4" />
         Học theo bài
        </Button>
       ) : (
        <Button variant="outline" onClick={() => selectModule("radicals")}>
         <Layers3 className="h-4 w-4" />
         Bộ thủ
        </Button>
       )}
      </div>

      {learning.isSaving && (
       <span className="text-xs font-black uppercase tracking-wide text-text-muted">
        Đang lưu...
       </span>
      )}
     </div>
    </Card>

    {activeModule !== "radicals" && <LessonDraftsCompactList />}

    {activeModule !== "radicals" && (
     <BookLessonSummary books={courseBooks} lessons={courseLessons} />
    )}

    {activeModule === "radicals" ? (
     <RadicalWorkspace radicals={data.radicals} />
    ) : (
     lesson && (
      <Tabs
       value={activeLessonModule}
       items={tabs}
       onValueChange={selectModule}
       className="hanzihome-module-tabs grid gap-4"
      >
       <TabsContent active={activeModule === "overview"}>
        <LessonOverview
         lesson={lesson}
         learningState={learning.state}
         onOpenModule={selectModule}
        />
       </TabsContent>

       <TabsContent active={activeModule === "vocab"}>
        <VocabWorkspace
         lesson={lesson}
         state={learning.state}
         onBookmark={(id) => learning.toggleBookmark("vocab", id)}
         onMarkStatus={markVocab}
        />
       </TabsContent>

       <TabsContent active={activeModule === "grammar"}>
        <GrammarWorkspace
         lesson={lesson}
         state={learning.state}
         onBookmark={(id) => learning.toggleBookmark("grammar", id)}
         onMarkStatus={markGrammar}
        />
       </TabsContent>

       <TabsContent active={activeModule === "review"}>
        <ReviewWorkspace
         lesson={lesson}
         learningState={learning.state}
         onAnswer={answerReview}
        />
       </TabsContent>
      </Tabs>
     )
    )}
   </div>
  </main>
 );
}
