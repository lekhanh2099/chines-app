"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { LessonPicker } from "@/features/hanzihome/components/LessonPicker";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/LessonTextInlineEditor";
import { ModuleSplitWorkspace } from "@/features/hanzihome/components/ModuleSplitWorkspace";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { ReviewWorkspace } from "@/features/hanzihome/components/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import {
 EditSeedLessonAsDraftButton,
 mapLessonDraftToHanziHomeLesson,
 useLessonDraftsQuery,
} from "@/features/hanzihome/lesson-drafts";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeLessonDetail } from "@/features/hanzihome/hooks/useHanziHomeLessonDetail";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { useCustomHanziHomeCourseCatalogQuery } from "@/features/hanzihome/courses/use-custom-courses";
import {
 hanzihomeCourseBooks,
 hanzihomeCourses,
 mergeCourseCatalogs,
 sortLessonsByCourseBookOrder,
} from "@/features/hanzihome/courses/course-catalog";
import type {
 HanziHomeModule,
 LearningStatus,
 ReviewResult,
} from "@/features/hanzihome/types";

type StudyModule = Exclude<HanziHomeModule, "radicals">;
const seedCopyLessonKeyPrefix = "seed-copy-";

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
 const catalogData = useHanziHomeCatalogData({ includeLessons: true });
 const draftsQuery = useLessonDraftsQuery();
 const learning = useLearningState();
 const customCourseCatalogQuery = useCustomHanziHomeCourseCatalogQuery();

 const publishedDraftLessons = useMemo(
  () =>
   (draftsQuery.data ?? [])
    .filter(
     (draft) =>
      draft.status === "published" &&
      !draft.lessonKey.startsWith(seedCopyLessonKeyPrefix),
    )
    .map(mapLessonDraftToHanziHomeLesson),
  [draftsQuery.data],
 );

 const seedLessonOverrides = useMemo(
  () =>
   (draftsQuery.data ?? []).filter(
    (draft) =>
     draft.status !== "archived" &&
     draft.lessonKey.startsWith(seedCopyLessonKeyPrefix),
   ),
  [draftsQuery.data],
 );

 const mergedCourseCatalog = useMemo(
  () =>
   mergeCourseCatalogs({
    staticCourses: catalogData.courses ?? hanzihomeCourses,
    staticBooks: catalogData.books ?? hanzihomeCourseBooks,
    customCourses: customCourseCatalogQuery.data?.courses ?? [],
    customBooks: customCourseCatalogQuery.data?.books ?? [],
   }),
  [catalogData.books, catalogData.courses, customCourseCatalogQuery.data],
 );

 const lessons = useMemo(
  () =>
   sortLessonsByCourseBookOrder([
    ...catalogData.lessons,
    ...publishedDraftLessons,
   ]),
  [catalogData.lessons, publishedDraftLessons],
 );

 const selectedCourseId =
  searchParams.get("courseId") ||
  learning.state.settings.lastCourseId ||
  (mergedCourseCatalog.courses?.[0]?.id ?? hanzihomeCourses[0]?.id) ||
  "";

 const courseLessons = useMemo(
  () =>
   lessons.filter(
    (item) =>
     (item.courseId ||
      (mergedCourseCatalog.courses?.[0]?.id ?? hanzihomeCourses[0]?.id)) ===
     selectedCourseId,
   ),
  [lessons, mergedCourseCatalog.courses, selectedCourseId],
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

 const activeLessonModule: StudyModule =
  activeModule === "radicals" ? "overview" : activeModule;

 const selectedDraftLesson = publishedDraftLessons.find(
  (item) => item.id === lessonId,
 );
 const selectedSeedOverrideDraft = seedLessonOverrides.find(
  (draft) => draft.lessonKey === `${seedCopyLessonKeyPrefix}${lessonId}`,
 );
 const selectedSeedOverrideLesson = selectedSeedOverrideDraft
  ? {
     ...mapLessonDraftToHanziHomeLesson(selectedSeedOverrideDraft),
     id: lessonId,
     sourceFile: "Bản chỉnh sửa cá nhân",
    }
  : null;
 const dbLesson = useHanziHomeLessonDetail(
  selectedDraftLesson || selectedSeedOverrideLesson ? null : lessonId,
 );
 const lesson = selectedDraftLesson || selectedSeedOverrideLesson || dbLesson;
 const selectedLessonId = lesson?.id || lessonId;

 const selectedCourse = mergedCourseCatalog.courses.find(
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
    <Card
     padding="md"
     className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
    >
     <div className="flex flex-wrap items-start justify-between gap-2.5">
      <div className="min-w-0 flex flex-2 items-center-safe gap-2.5">
       <div className="max-w-lg">
        {activeModule !== "radicals" && lesson && (
         <LessonPicker
          lessons={courseLessons}
          selectedLessonId={selectedLessonId}
          onSelectLesson={selectLesson}
         />
        )}
       </div>

       <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-black text-text-muted">
         {activeModule === "radicals"
          ? `${catalogData.radicals.length} bộ thủ`
          : subtitle}
        </span>

        {learning.isSaving && (
         <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-black text-text-muted">
          Đang lưu...
         </span>
        )}
        {lesson && lesson.draftId ? (
         <Button asChild variant="outline" size="sm">
          <Link href={`/hanzihome/drafts/${lesson.draftId}`}>
           <Pencil className="h-4 w-4" />
           Chỉnh sửa
          </Link>
         </Button>
        ) : (
         lesson && (
          <EditSeedLessonAsDraftButton lessonId={lesson.id} size="sm" />
         )
        )}
       </div>
      </div>
     </div>
    </Card>

    {activeModule === "radicals" ? (
     <RadicalWorkspace radicals={catalogData.radicals} />
    ) : (
     lesson && (
      <ModuleSplitWorkspace
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
