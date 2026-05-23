"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
 BookOpen,
 FileText,
 GraduationCap,
 Home,
 RotateCcw,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import type { SegmentedControlItem } from "@/components/ui/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { LessonPicker } from "@/features/hanzihome/components/LessonPicker";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/LessonTextInlineEditor";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { ReviewWorkspace } from "@/features/hanzihome/components/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import {
 mapLessonDraftToHanziHomeLesson,
 useLessonDraftsQuery,
} from "@/features/hanzihome/lesson-drafts";
import { useHanziHomeData } from "@/features/hanzihome/hooks/useHanziHomeData";
import { useHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLesson";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { useCustomHanziHomeCourseCatalogQuery } from "@/features/hanzihome/courses/use-custom-courses";
import {
 hanzihomeCourseBooks,
 hanzihomeCourses,
 mergeCourseCatalogs,
 sortLessonsByCourseBookOrder,
} from "@/features/hanzihome/courses/course-catalog";
import type {
 HanziHomeData,
 HanziHomeModule,
 LearningStatus,
 ReviewResult,
} from "@/features/hanzihome/types";

const tabs = [
 { key: "overview" as const, label: "Tổng quan", icon: Home },
 { key: "lessonText" as const, label: "Bài khóa", icon: FileText },
 { key: "vocab" as const, label: "Từ vựng", icon: BookOpen },
 { key: "grammar" as const, label: "Ngữ pháp", icon: GraduationCap },
 { key: "review" as const, label: "Ôn tập", icon: RotateCcw },
] satisfies SegmentedControlItem<Exclude<HanziHomeModule, "radicals">>[];

const moduleValues = [
 "overview",
 "lessonText",
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
 const customCourseCatalogQuery = useCustomHanziHomeCourseCatalogQuery();

 const publishedDraftLessons = useMemo(
  () =>
   (draftsQuery.data ?? [])
    .filter((draft) => draft.status === "published")
    .map(mapLessonDraftToHanziHomeLesson),
  [draftsQuery.data],
 );

 const mergedCourseCatalog = useMemo(
  () =>
   mergeCourseCatalogs({
    staticCourses: staticData.courses ?? hanzihomeCourses,
    staticBooks: staticData.books ?? hanzihomeCourseBooks,
    customCourses: customCourseCatalogQuery.data?.courses ?? [],
    customBooks: customCourseCatalogQuery.data?.books ?? [],
   }),
  [customCourseCatalogQuery.data, staticData.books, staticData.courses],
 );

 const data = useMemo<HanziHomeData>(
  () => ({
   ...staticData,
   courses: mergedCourseCatalog.courses,
   books: mergedCourseCatalog.books,
   lessons: sortLessonsByCourseBookOrder([
    ...staticData.lessons,
    ...publishedDraftLessons,
   ]),
  }),
  [
   mergedCourseCatalog.books,
   mergedCourseCatalog.courses,
   publishedDraftLessons,
   staticData,
  ],
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

 const lessonIdFromUrl = searchParams.get("lessonId");
 const lastLessonId = learning.state.settings.lastLessonId;
 const lessonIdFromUrlInCourse = courseLessons.some(
  (item) => item.id === lessonIdFromUrl,
 );
 const lastLessonIdInCourse = courseLessons.some(
  (item) => item.id === lastLessonId,
 );

 const fallbackLessonId = courseLessons.at(-1)?.id || "";

 const lessonId =
  (lessonIdFromUrlInCourse ? lessonIdFromUrl : null) ||
  (lastLessonIdInCourse ? lastLessonId : null) ||
  fallbackLessonId;

 const activeModule =
  parseModule(searchParams.get("module")) ||
  learning.state.settings.lastModule ||
  "overview";

 const activeLessonModule =
  activeModule === "radicals" ? "overview" : activeModule;

 const lesson = useHanziHomeLesson(data, lessonId);
 const selectedLessonId = lesson?.id || lessonId;

 const selectedCourse = data.courses.find(
  (course) => course.id === selectedCourseId,
 );
 const subtitle = useMemo(() => {
  if (!lesson) return "Không có dữ liệu bài học.";
  return `${lesson.vocab.length} từ · ${lesson.grammar.length} điểm ngữ pháp`;
 }, [lesson]);

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
      <div className="grid gap-4">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         {selectedCourse?.title || "HanziHome"}
        </p>

        <h1 className="mt-1 text-2xl font-black text-text-primary">
         Course này chưa có bài học
        </h1>

        <p className="mt-1 text-sm font-semibold text-text-muted">
         Quay về thư viện học liệu để tạo bài mới hoặc chọn course khác.
        </p>
       </div>

       <Link
        href="/"
        className="w-fit rounded-2xl bg-bg-inverse px-4 py-2 text-sm font-black text-text-inverse"
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
   <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
    <Card padding="lg" className="overflow-hidden rounded-2xl ">
     <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
       <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
         {activeModule === "radicals"
          ? "HanziHome / Bộ thủ"
          : lesson?.courseTitle || selectedCourse?.title || "HanziHome"}
        </p>

        <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
         {activeModule === "radicals" ? "Thư viện bộ thủ" : lesson?.title}
        </h1>

        <div className="mt-2 flex flex-wrap gap-2">
         <span className="rounded-2xl -full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
          {activeModule === "radicals"
           ? `${data.radicals.length} bộ thủ`
           : subtitle}
         </span>

         {activeModule !== "radicals" && lesson?.draftId && (
          <Link
           href={`/hanzihome/drafts/${lesson.draftId}`}
           className="rounded-2xl -full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted"
          >
           Sửa bài
          </Link>
         )}
         {learning.isSaving && (
          <span className="rounded-2xl -full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
           Đang lưu...
          </span>
         )}
        </div>
       </div>

       {activeModule !== "radicals" && lesson && (
        <div className="max-w-lg rounded-2xl border border-border-default bg-bg-subtle p-3">
         <LessonPicker
          lessons={courseLessons}
          selectedLessonId={selectedLessonId}
          onSelectLesson={selectLesson}
         />
        </div>
       )}
      </div>
     </div>
    </Card>

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

       <TabsContent active={activeModule === "lessonText"}>
        <LessonTextInlineEditor lesson={lesson} />
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
