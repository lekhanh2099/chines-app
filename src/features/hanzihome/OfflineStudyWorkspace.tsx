"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useClientSession } from "@/components/providers/QueryProvider";
import { FocusModeRouteGuard } from "@/components/layout/navigation/FocusModeRouteGuard";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";
import { ModuleSplitWorkspace } from "./components/ModuleSplitWorkspace";
import { BusinessChineseStudyWorkspace } from "./components/business-chinese/BusinessChineseStudyWorkspace";
import { BusinessChineseLessonSelector } from "./components/business-chinese/BusinessChineseLessonSelector";
import { HanziHomeWorkspaceLoading } from "./components/layout/HanziHomeWorkspaceLoading";
import { useHanziHomeLesson } from "./hooks/useHanziHomeLesson";
import { LearningStateSyncAgent, useLearningState } from "./hooks/useLearningState";
import { listCachedLessonSummaries } from "./local/lesson-content-cache";
import { hanzihomeQueryKeys } from "./query-keys";
import { findLessonByRouteParam } from "./utils/lesson-route";
import { parseHanziHomeModule, resolveLessonModule } from "./workspace-modules";
import { getTextbookCatalogForBookKeys, type TextbookLesson } from "./static-json/textbook-catalog";
import {
 fetchTextbookLesson,
 listRememberedTextbookLessons,
} from "./static-json/textbook-lesson-client";
import { focusModeStore } from "@/stores/shell/focus-mode-store";

/** Textbooks offered offline; a lesson is readable once it has been opened online. */
const offlineTextbookKeys = [
 "tm3",
 "nhip-cau",
 "doc-hieu",
 "khau-ngu",
] satisfies readonly TextbookLesson["bookKey"][];

function OfflineLessonStudy({ lessonId }: { lessonId: string }) {
 const searchParams = useSearchParams();
 const t = useTranslations("Common");
 const learning = useLearningState();
 const detail = useHanziHomeLesson(lessonId);
 if (learning.isLoading || detail.isLoading) return <HanziHomeWorkspaceLoading />;
 if (detail.isError || !detail.lesson) {
  return (
   <Card padding="lg">
    <PageHeader
     title={t("syncStatus.offlineUnavailableTitle")}
     description={t("syncStatus.offlineUnavailableDescription")}
     actions={
      <Button variant="outline" onClick={() => void detail.refetch()}>
       {t("actions.retry")}
      </Button>
     }
    />
   </Card>
  );
 }
 const activeModule = resolveLessonModule({
  requestedModule: parseHanziHomeModule(searchParams.get("module")) ?? "overview",
  isListeningLesson: detail.lesson.tags?.includes("listening") ?? false,
 });
 return (
  <div className="hanzihome-workspace-page min-h-0 flex-1">
   <ModuleSplitWorkspace
    readOnly={false}
    lesson={detail.lesson}
    learningState={learning.state}
    learningSync={{
     status: learning.syncStatus,
     durability: learning.durability,
     pendingCount: learning.pendingSyncCount,
     lastError: learning.lastSyncError,
     isOnline: learning.isOnline,
     retry: learning.retrySync,
    }}
    activeModule={activeModule}
    onSelectModule={(module) => {
     const next = new URLSearchParams(searchParams.toString());
     next.set("module", module);
     window.history.pushState(null, "", `?${next.toString()}`);
    }}
    onUpdateLearningSettings={learning.updateSettings}
    onBookmarkVocab={(id) => learning.toggleBookmark("vocab", id)}
    onMarkVocab={learning.updateVocabProgress}
    onBookmarkGrammar={(id) => learning.toggleBookmark("grammar", id)}
    onMarkGrammar={learning.updateGrammarProgress}
    onAnswerReview={learning.recordReview}
   />
  </div>
 );
}

function OfflineLessonLibrary({ ownerId }: { ownerId: string }) {
 const t = useTranslations("Common");
 const searchParams = useSearchParams();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const summaries = useQuery({
  queryKey: hanzihomeQueryKeys.offlineLessons(ownerId),
  queryFn: () => listCachedLessonSummaries(ownerId),
  networkMode: "always",
 });
 const selected = findLessonByRouteParam(
  (summaries.data ?? []).filter(
   (lesson) => !searchParams.get("courseId") || lesson.courseId === searchParams.get("courseId"),
  ),
  searchParams.get("lesson"),
  searchParams.get("lessonId"),
  searchParams.get("bookId"),
 );
 const hasSelection = searchParams.has("lesson") || searchParams.has("lessonId");
 return (
  <>
   {summaries.isPending ? (
    <HanziHomeWorkspaceLoading />
   ) : summaries.isError ? (
    <Card padding="lg">
     <PageHeader
      title={t("offlineStudy.storageError")}
      description={t("offlineStudy.storageErrorDescription")}
      actions={
       <Button variant="outline" onClick={() => void summaries.refetch()}>
        {t("actions.retry")}
       </Button>
      }
     />
    </Card>
   ) : hasSelection ? (
    selected ? (
     <OfflineLessonStudy key={selected.id} lessonId={selected.id} />
    ) : (
     <Card padding="lg">
      <PageHeader
       title={t("syncStatus.offlineUnavailableTitle")}
       description={t("syncStatus.offlineUnavailableDescription")}
      />
     </Card>
    )
   ) : summaries.data?.length ? (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("offlineStudy.library")}>
     {summaries.data.map((lesson) => (
      <li key={lesson.id}>
       <Card padding="md" className="grid h-full gap-3">
        <Typography as="h2" variant="sectionTitle">
         {lesson.title}
        </Typography>
        <Typography as="p" lang="zh-CN">
         {lesson.titleZh}
        </Typography>
        <Button
         variant="outline"
         disabled={focusModeEnabled}
         onClick={() => {
          const next = new URLSearchParams();
          next.set("lessonId", lesson.id);
          window.history.pushState(null, "", `?${next.toString()}`);
         }}
        >
         {t("offlineStudy.open")}
        </Button>
       </Card>
      </li>
     ))}
    </ul>
   ) : (
    <Card padding="lg">
     <PageHeader title={t("offlineStudy.empty")} description={t("offlineStudy.emptyDescription")} />
    </Card>
   )}
   {!hasSelection ? (
    <ul
     className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
     aria-label={t("offlineStudy.textbooks")}
    >
     {getTextbookCatalogForBookKeys(offlineTextbookKeys).map((book) => (
      <li key={book.id}>
       <Card padding="md" className="grid h-full gap-3">
        <Typography as="h2" variant="sectionTitle">
         {book.label}
        </Typography>
        <Button
         variant="outline"
         disabled={focusModeEnabled}
         onClick={() => {
          const next = new URLSearchParams();
          next.set("book", book.key);
          window.history.pushState(null, "", `?${next.toString()}`);
         }}
        >
         {t("offlineStudy.openTextbook")}
        </Button>
       </Card>
      </li>
     ))}
    </ul>
   ) : null}
  </>
 );
}

export function OfflineStudyWorkspace() {
 const { isResolved, userId } = useClientSession();
 const queryClient = useQueryClient();
 const searchParams = useSearchParams();
 const t = useTranslations("Common.offlineStudy");
 const shell = useTranslations("Shell");
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const books = getTextbookCatalogForBookKeys(offlineTextbookKeys);
 const book = books.find((item) => item.key === searchParams.get("book"));
 const summary =
  book?.lessons.find((item) => item.number === Number(searchParams.get("lesson"))) ??
  book?.lessons[0];
 // Lessons are not bundled: a lesson opened while online is served again from
 // the offline cache by the service worker.
 const textbookLesson = useQuery({
  queryKey: hanzihomeQueryKeys.textbookLesson(book?.key ?? "", summary?.number ?? 0),
  queryFn: ({ signal }) =>
   book && summary ? fetchTextbookLesson(book.key, summary.number, signal) : null,
  enabled: Boolean(book && summary),
  staleTime: Number.POSITIVE_INFINITY,
  retry: false,
  // The service worker answers from the offline cache; never pause while offline.
  networkMode: "always",
 });
 // When the requested lesson is not on the device, the saved ones stay reachable.
 const lessonUnavailable = Boolean(book) && textbookLesson.isError;
 const rememberedLessons = useQuery({
  queryKey: hanzihomeQueryKeys.rememberedTextbookLessons(book?.key ?? ""),
  queryFn: () => (book ? listRememberedTextbookLessons(book.key) : []),
  enabled: lessonUnavailable,
  networkMode: "always",
  staleTime: 0,
 });
 const savedLessons =
  book?.lessons.filter((item) => rememberedLessons.data?.includes(item.number)) ?? [];
 if (!isResolved || !userId) {
  return (
   <Card padding="lg">
    <PageHeader title={t("title")} description={t(isResolved ? "sessionUnavailable" : "loading")} />
   </Card>
  );
 }
 const lesson = textbookLesson.data ?? null;
 return (
  <>
   <FocusModeRouteGuard />
   <LearningStateSyncAgent />
   <Card padding="lg">
    <PageHeader
     title={t("title")}
     description={t("description")}
     actions={
      <>
       {lesson ? (
        <BusinessChineseLessonSelector
         books={books}
         lesson={lesson}
         focusModeEnabled={focusModeEnabled}
        />
       ) : null}
       <Button
        variant="outline"
        aria-pressed={focusModeEnabled}
        onClick={() => focusModeStore.actions.setEnabled(!focusModeEnabled)}
       >
        {shell("header.focusMode")}
       </Button>
       <Button
        variant="outline"
        disabled={focusModeEnabled}
        onClick={() => {
         window.history.pushState(null, "", window.location.pathname);
         void queryClient.invalidateQueries({
          queryKey: hanzihomeQueryKeys.offlineLessons(userId),
          exact: true,
         });
        }}
       >
        {t("library")}
       </Button>
      </>
     }
    />
   </Card>
   {searchParams.has("book") ? (
    lesson ? (
     <BusinessChineseStudyWorkspace key={`${userId}:${lesson.id}`} books={books} lesson={lesson} />
    ) : textbookLesson.isPending && book ? (
     <HanziHomeWorkspaceLoading />
    ) : (
     <Card padding="lg">
      <PageHeader
       title={t(book ? "lessonNotSaved" : "textbookUnavailable")}
       description={t(book ? "lessonNotSavedDescription" : "emptyDescription")}
      />
      {book && savedLessons.length > 0 ? (
       <section className="mt-4 grid gap-2" aria-labelledby="offline-saved-lessons-heading">
        <Typography as="h2" variant="cardTitle" id="offline-saved-lessons-heading">
         {t("savedLessons")}
        </Typography>
        <ul className="flex flex-wrap gap-2">
         {savedLessons.map((item) => (
          <li key={item.id}>
           <Button
            variant="outline"
            onClick={() =>
             window.history.pushState(null, "", `?book=${book.key}&lesson=${item.number}`)
            }
           >
            {item.title}
           </Button>
          </li>
         ))}
        </ul>
       </section>
      ) : null}
     </Card>
    )
   ) : (
    <OfflineLessonLibrary key={userId} ownerId={userId} />
   )}
  </>
 );
}
