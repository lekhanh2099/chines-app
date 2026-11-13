"use client";

import {
 ArrowLeft,
 FileText,
 History,
 PictureInPicture2,
 Search,
 Settings,
 Volume2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Separator } from "@/components/ui/layout/separator";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import {
 UniversalAmbientPip,
 type UniversalPipMode,
} from "@/features/hanzihome/components/review/UniversalAmbientPip";
import {
 buildExercisesFromVocabItems,
 customVocabListToHanziHomeVocabItems,
} from "@/features/hanzihome/components/review/vocab-hub-custom";
import { useDocumentPip } from "@/features/hanzihome/hooks/useDocumentPip";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 analyzeContextualPronunciation,
 formatContextualReadingPinyin,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { JsonFieldValue } from "@/types/json";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { fetchReaderAnnotations } from "@/features/reading/services/reading-annotation-api";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import { ReaderNotes } from "@/features/reading/components/ReaderStudyModules";
import {
 businessChinesePronunciationAnalyses,
 businessChineseReaderAnnotations,
} from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import { DailyReadingNoteCard } from "@/features/daily-reading/components/DailyReadingNoteCard";
import { Reader } from "@/features/reader/components/Reader";
import { useMandarinReaderSpeechService } from "@/features/speech/MandarinTtsProvider";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { useReaderSessionPronunciation } from "@/features/reading/hooks/useReaderSessionPronunciation";
import { DailyReadingLearningSupportPanel } from "@/features/daily-reading/components/DailyReadingLearningSupportPanel";
import { DailyReadingActivityLog } from "@/features/daily-reading/components/DailyReadingActivityLog";
import type { DailyReadingTopic } from "@/features/daily-reading/model/daily-reading.schemas";
import {
 captureDailyReadingNow,
 useDailyReadingLibrary,
 useDailyReadingSettings,
} from "@/features/daily-reading/services/daily-reading.client";
import {
 enrichDailyReadingLearningSupport,
 reconcilePendingDailyReadingEnrichmentJobs,
} from "@/features/daily-reading/enrichment/daily-reading-enrichment.client";
import {
 dailyReadingTranslationProgressEventSchema,
 type DailyReadingTranslationProgressEvent,
} from "@/features/daily-reading/enrichment/daily-reading-enrichment.schemas";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";
import {
 buildDailyReadingActivityEntries,
 buildDailyReadingReaderDocument,
 getDailyReadingLearningSummary,
} from "@/features/daily-reading/model/daily-reading-view-model";
import { resolveDailyReadingReleaseState } from "@/features/daily-reading/model/daily-reading.scheduler";

type LibraryView = "articles" | "activity";
type DailyReadingTab =
 | "reader"
 | "notes"
 | "support"
 | "questions"
 | "vocabulary"
 | "grammar"
 | "source";
type DailyReadingTabTranslationKey =
 | "tabs.reader"
 | "tabs.notes"
 | "detail.supportTab"
 | "tabs.questions"
 | "tabs.vocabulary"
 | "tabs.grammar"
 | "tabs.source";

const fallbackTabs: readonly DailyReadingTab[] = ["reader", "notes", "support", "source"];
const contextualPronunciationMaximumCharacters = 2_000;

const emptyReaderDocument: ReaderDocumentModel = {
 id: "empty",
 language: "zh-CN",
 source: {
  kind: "article",
  sourceId: "empty",
  href: "",
  label: "",
 },
 sections: [],
 segments: [],
 metadata: [],
 capabilities: ["pinyin", "translation"],
};

type TopicTranslationKey =
 | "generated.topic.culture"
 | "generated.topic.education"
 | "generated.topic.history"
 | "generated.topic.language"
 | "generated.topic.science"
 | "generated.topic.society"
 | "generated.topic.travel"
 | "generated.topic.environment"
 | "generated.topic.health";

function getTopicTranslationKey(topic: DailyReadingTopic): TopicTranslationKey {
 switch (topic) {
  case "culture":
   return "generated.topic.culture";
  case "education":
   return "generated.topic.education";
  case "history":
   return "generated.topic.history";
  case "language":
   return "generated.topic.language";
  case "science":
   return "generated.topic.science";
  case "society":
   return "generated.topic.society";
  case "travel":
   return "generated.topic.travel";
  case "environment":
   return "generated.topic.environment";
  case "health":
   return "generated.topic.health";
 }
}

function availableTabs(reading: DailyReading): readonly DailyReadingTab[] {
 const tabs: DailyReadingTab[] = ["reader", "notes", "support"];
 if (reading.enrichment.vocabulary.status === "ready") tabs.push("vocabulary");
 if (reading.enrichment.grammar.status === "ready") tabs.push("grammar");
 if (reading.enrichment.questions.status === "ready") tabs.push("questions");
 tabs.push("source");
 return tabs;
}

function tabLabelKey(tab: DailyReadingTab): DailyReadingTabTranslationKey {
 switch (tab) {
  case "reader":
   return "tabs.reader";
  case "notes":
   return "tabs.notes";
  case "support":
   return "detail.supportTab";
  case "questions":
   return "tabs.questions";
  case "vocabulary":
   return "tabs.vocabulary";
  case "grammar":
   return "tabs.grammar";
  case "source":
   return "tabs.source";
 }
}

function analyzeDailyReadingText(text: string) {
 if (text.length === 0 || text.length > contextualPronunciationMaximumCharacters) return null;
 try {
  return analyzeContextualPronunciation({ text });
 } catch {
  return null;
 }
}

function learningStatusVariant(reading: DailyReading): ComponentProps<typeof Badge>["variant"] {
 const summary = getDailyReadingLearningSummary(reading);
 if (summary.complete) return "success";
 if (summary.running) return "info";
 if (summary.attention) return "warning";
 return "default";
}

export function DailyReadingLibrary() {
 const t = useTranslations("DailyReading");
 const locale = useLocale();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const library = useDailyReadingLibrary();
 const { settings } = useDailyReadingSettings();
 const [capturing, setCapturing] = useState(false);
 const view: LibraryView = searchParams.get("view") === "activity" ? "activity" : "articles";
 const release = resolveDailyReadingReleaseState(new Date(), settings.captureTime);
 const scheduledToday = library.items.some(
  (item) => item.releaseKind === "scheduled" && item.publishedDate === release.dateKey,
 );
 const activeCaptureRun = library.captureRuns.find(
  (run) => run.date === release.dateKey && run.status === "pending",
 );
 const latestTodayCaptureRun = library.captureRuns.find((run) => run.date === release.dateKey);
 const activityEntries = useMemo(
  () =>
   buildDailyReadingActivityEntries({
    items: library.items,
    captureRuns: library.captureRuns,
    enrichmentRuns: library.enrichmentRuns,
   }),
  [library.captureRuns, library.enrichmentRuns, library.items],
 );
 const dateFormatter = useMemo(
  () =>
   new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
   }),
  [locale],
 );
 const captureTime = `${String(settings.captureTime.hour).padStart(2, "0")}:${String(settings.captureTime.minute).padStart(2, "0")}`;
 const todayStatus =
  activeCaptureRun !== undefined
   ? t("library.status.todayRunning")
   : scheduledToday
     ? t("library.status.todayReady")
     : latestTodayCaptureRun?.status === "failed"
       ? t("library.status.todayFailed")
       : !settings.autoCaptureEnabled
         ? t("library.status.manualOnly")
         : release.isDue
           ? t("library.status.todayDue")
           : t("library.status.todayWaiting");

 function readingHref(id: string) {
  const next = new URLSearchParams(searchParams.toString());
  next.set("generated", id);
  return `${pathname}?${next.toString()}`;
 }

 function setView(nextView: LibraryView) {
  const next = new URLSearchParams(searchParams.toString());
  if (nextView === "articles") next.delete("view");
  else next.set("view", nextView);
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 }

 const [articleSearchQuery, setArticleSearchQuery] = useState("");
 const filteredArticles = useMemo(() => {
  if (!articleSearchQuery.trim()) return library.items;
  const q = articleSearchQuery.trim().toLowerCase();
  return library.items.filter((reading) => {
   const titleZh = reading.article.titleZh.toLowerCase();
   const publisher = reading.source.publisher.toLowerCase();
   const titleVi =
    reading.enrichment.translation.status === "ready"
     ? reading.enrichment.translation.data.titleVi.toLowerCase()
     : "";
   return titleZh.includes(q) || publisher.includes(q) || titleVi.includes(q);
  });
 }, [library.items, articleSearchQuery]);

 async function captureArticle() {
  setCapturing(true);
  try {
   const reading = await captureDailyReadingNow("manual");
   toast.success(t("settings.toast.articleReady", { title: reading.article.titleZh }));
   router.push(readingHref(reading.id), { scroll: false });
   if (settings.autoEnrichmentEnabled) {
    void enrichDailyReadingLearningSupport(reading.id).catch(() => undefined);
   }
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("settings.toast.captureFailed"));
  } finally {
   setCapturing(false);
  }
 }

 return (
  <div className="grid min-w-0 gap-5 sm:gap-6">
   <PageHeader
    eyebrow={t("header.eyebrow")}
    title={t("header.title")}
    description={t("library.description")}
    actions={
     <>
      <Button type="button" variant="outline" size="toolbar" asChild>
       <Link href="/settings?section=ai&panel=daily-reading" prefetch={false}>
        <Settings data-icon="inline-start" />
        {t("actions.openSettings")}
       </Link>
      </Button>
      <Button
       type="button"
       size="toolbar"
       onClick={() => void captureArticle()}
       disabled={capturing}
      >
       {capturing ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
       {capturing ? t("actions.findingArticle") : t("actions.findNewArticle")}
      </Button>
     </>
    }
   />

   <Card variant="subtle" padding="md" className="grid gap-3 sm:grid-cols-3 sm:gap-4">
    <div className="grid min-w-0 gap-1">
     <Typography variant="caption" tone="muted" weight="bold">
      {t("library.status.todayLabel")}
     </Typography>
     <Typography weight="semibold">{todayStatus}</Typography>
    </div>
    <div className="grid min-w-0 gap-1">
     <Typography variant="caption" tone="muted" weight="bold">
      {t("library.status.scheduleLabel")}
     </Typography>
     <Typography weight="semibold">
      {settings.autoCaptureEnabled
       ? t("library.status.scheduleEnabled", { time: captureTime })
       : t("library.status.scheduleDisabled")}
     </Typography>
    </div>
    <div className="grid min-w-0 gap-1">
     <Typography variant="caption" tone="muted" weight="bold">
      {t("library.status.libraryLabel")}
     </Typography>
     <Typography weight="semibold">
      {t("settings.capture.libraryCount", { count: library.items.length })}
     </Typography>
    </div>
   </Card>

   <Tabs
    value={view}
    items={[
     { key: "articles", label: t("library.tabs.articles"), icon: FileText },
     { key: "activity", label: t("library.tabs.activity"), icon: History },
    ]}
    onValueChange={setView}
    listClassName="hanzihome-liquid-toolbar flex"
    aria-label={t("library.tabs.aria")}
   >
    <TabsContent value="articles" className="pt-4">
     <div className="grid gap-3">
      {library.items.length > 0 ? (
       <Card
        variant="subtle"
        padding="sm"
        className="flex min-w-0 flex-wrap items-center justify-between gap-2.5"
       >
        <div className="flex min-w-0 items-center gap-2">
         <Typography
          variant="caption"
          tone="muted"
          weight="bold"
          tracking="wide"
          transform="uppercase"
          className="hidden sm:inline"
         >
          {t("library.tabs.articles")}
         </Typography>
         <Badge variant="default" casing="natural">
          {library.items.length} bài
         </Badge>
         <div className="relative min-w-[150px] sm:min-w-[220px]">
          <Input
           type="search"
           density="compact"
           adornment="start"
           value={articleSearchQuery}
           onChange={(e) => setArticleSearchQuery(e.target.value)}
           placeholder="Tìm bài đọc..."
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
         </div>
         {articleSearchQuery ? (
          <Typography variant="caption" tone="secondary">
           ({filteredArticles.length} kết quả)
          </Typography>
         ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
         <Button
          type="button"
          size="toolbar"
          onClick={() => void captureArticle()}
          disabled={capturing}
         >
          {capturing ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
          {capturing ? t("actions.findingArticle") : t("actions.findNewArticle")}
         </Button>
        </div>
       </Card>
      ) : null}

      {filteredArticles.length === 0 && articleSearchQuery ? (
       <Card variant="subtle" padding="lg" className="text-center">
        <Typography variant="bodySmall" tone="muted">
         Không tìm thấy bài đọc nào khớp với &ldquo;{articleSearchQuery}&rdquo;
        </Typography>
       </Card>
      ) : null}

      {library.items.length === 0 ? (
       <Card variant="subtle" padding="lg" className="grid gap-2">
        <Typography weight="bold">{t("empty.title")}</Typography>
        <Typography variant="bodySmall" tone="muted">
         {t("library.description")}
        </Typography>
       </Card>
      ) : (
       filteredArticles.slice(0, 30).map((reading) => {
        const translation =
         reading.enrichment.translation.status === "ready"
          ? reading.enrichment.translation.data
          : null;
        const learning = getDailyReadingLearningSummary(reading);
        const learningLabel = learning.complete
         ? t("library.article.learningComplete")
         : learning.running
           ? t("library.article.learningRunning")
           : learning.attention
             ? t("library.article.learningAttention")
             : t("library.article.learningPending", {
                ready: learning.ready,
                total: learning.total,
               });
        return (
         <Card
          key={reading.id}
          asChild
          variant="interactive"
          padding="md"
          className="group min-w-0"
         >
          <Link href={readingHref(reading.id)} prefetch={false}>
           <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="grid min-w-0 gap-1.5">
             <Typography variant="caption" tone="muted" weight="medium">
              {dateFormatter.format(new Date(reading.capturedAt))} · {reading.source.publisher} ·{" "}
              {reading.releaseKind === "scheduled"
               ? t("generated.kind.scheduled")
               : t("generated.kind.manual")}
             </Typography>
             <HanziText as="h3" size="card" clamp="two" weight="bold">
              {reading.article.titleZh}
             </HanziText>
             {translation !== null ? (
              <Typography variant="bodySmall" tone="secondary" clamp="two">
               {translation.titleVi}
              </Typography>
             ) : null}
             <div className="flex min-w-0 flex-wrap items-center gap-2">
              {reading.classification.targetLevel !== null ? (
               <Badge variant="warning" size="sm" casing="natural">
                {reading.classification.targetLevel}
               </Badge>
              ) : null}
              <Badge size="sm" casing="natural">
               {t(getTopicTranslationKey(reading.classification.topic))}
              </Badge>
              <Typography variant="caption" tone="muted">
               {t("sample.minutes", { count: reading.estimatedMinutes })}
              </Typography>
             </div>
            </div>
            <div className="flex min-w-0 items-center lg:justify-end">
             <Badge variant={learningStatusVariant(reading)} size="sm" casing="natural">
              {learningLabel}
             </Badge>
            </div>
           </div>
          </Link>
         </Card>
        );
       })
      )}
     </div>
    </TabsContent>
    <TabsContent value="activity" className="pt-4">
     <div className="grid gap-3">
      <div className="grid gap-1">
       <Typography as="h2" variant="sectionTitle" weight="bold">
        {t("activity.title")}
       </Typography>
       <Typography variant="bodySmall" tone="muted">
        {t("activity.description")}
       </Typography>
      </div>
      <DailyReadingActivityLog
       entries={activityEntries}
       articleHref={readingHref}
       retrying={capturing}
       onRetryCapture={() => void captureArticle()}
      />
     </div>
    </TabsContent>
   </Tabs>
  </div>
 );
}

function Questions({ reading }: { reading: DailyReading }) {
 const t = useTranslations("DailyReading");
 const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
 if (reading.enrichment.questions.status !== "ready") return null;
 return (
  <div className="grid gap-3">
   {reading.enrichment.questions.data.items.map((question, index) => {
    const isRevealed = revealed.has(question.id);
    return (
     <Card key={question.id} variant="section" padding="md" className="grid gap-3">
      <div className="flex items-start gap-3">
       <Badge variant="info" size="sm">
        {index + 1}
       </Badge>
       <div className="grid min-w-0 gap-1">
        <HanziText as="p" size="medium">
         {question.promptZh}
        </HanziText>
        <Typography variant="bodySmall" tone="muted">
         {question.promptVi}
        </Typography>
       </div>
      </div>
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       className="justify-self-start"
       onClick={() =>
        setRevealed((current) => {
         const next = new Set(current);
         if (next.has(question.id)) next.delete(question.id);
         else next.add(question.id);
         return next;
        })
       }
      >
       {isRevealed ? t("generated.questions.hideAnswer") : t("generated.questions.showAnswer")}
      </Button>
      {isRevealed ? (
       <>
        <Separator />
        <div className="grid gap-1">
         <HanziText as="p" size="medium">
          {question.answerZh}
         </HanziText>
         <Typography variant="bodySmall" tone="secondary">
          {question.answerVi}
         </Typography>
        </div>
       </>
      ) : null}
     </Card>
    );
   })}
  </div>
 );
}

export function DailyReadingView({ id, onBack }: { id: string; onBack(): void }) {
 const t = useTranslations("DailyReading");
 const locale = useLocale();
 const library = useDailyReadingLibrary();
 const learningState = useLearningState();
 const speech = useMandarinReaderSpeechService();
 const { openInspector } = useVocabInspector();
 const { userId, isResolved } = useClientSession();
 const [annotationError, setAnnotationError] = useState("");
 const displayMode =
  learningState.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const reading = library.items.find((item) => item.id === id) ?? null;
 const [tab, setTab] = useState<DailyReadingTab>("reader");
 const [translationProgressState, setTranslationProgressState] = useState<{
  runId: string;
  events: DailyReadingTranslationProgressEvent[];
 }>({ runId: "", events: [] });
 const tabs = reading === null ? fallbackTabs : availableTabs(reading);
 const tabItems = tabs.map((key) => ({ key, label: t(tabLabelKey(key)) }));
 const translation =
  reading?.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
 const translationRun = library.enrichmentRuns.find(
  (run) =>
   reading !== null &&
   run.articleId === reading.id &&
   run.articleFingerprint === reading.article.fingerprint &&
   run.module === "translation",
 );
 const translationWorkflowRunId =
  translationRun?.status === "pending" || translationRun?.status === "failed"
   ? translationRun.workflowRunId
   : "";
 const translationRunId = translationRun?.runId ?? "";
 const translationProgressEvents =
  translationProgressState.runId === translationRunId ? translationProgressState.events : [];
 const streamArticleId = reading?.id ?? "";
 const streamArticleFingerprint = reading?.article.fingerprint ?? "";
 const transientTranslationParagraphs = translationProgressEvents.flatMap(
  (event) => event.paragraphs,
 );
 const latestTranslationProgress = translationProgressEvents.at(-1);
 const readerDocument =
  reading === null
   ? null
   : buildDailyReadingReaderDocument(reading, transientTranslationParagraphs);
 const titlePronunciation =
  reading === null ? null : analyzeDailyReadingText(reading.article.titleZh);
 const pronunciation = useReaderSessionPronunciation(readerDocument?.segments ?? [], true);
 const dateFormatter = useMemo(
  () =>
   new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
   }),
  [locale],
 );

 const annotationsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerAnnotations(userId, reading?.id ?? ""),
  queryFn: () => (reading ? fetchReaderAnnotations(userId, reading.id) : []),
  enabled: isResolved && Boolean(userId) && Boolean(reading),
  staleTime: 60_000,
 });

 useEffect(() => {
  if (annotationError) {
   toast.error(annotationError);
  }
 }, [annotationError]);

 const readerVocabulary: ReaderDocumentResource["vocabulary"] =
  reading && reading.enrichment.vocabulary.status === "ready"
   ? reading.enrichment.vocabulary.data.items.map((item) => ({
      id: item.id,
      word: item.hanzi,
      pinyin: "",
      meaning: item.meaningVi,
     }))
   : [];

 const analysisBySegmentId = readerDocument
  ? businessChinesePronunciationAnalyses(readerDocument)
  : new Map();

 const selection = useReaderSelectionActions({
  document: readerDocument ?? emptyReaderDocument,
  vocabulary: readerVocabulary,
  stateOwner: "daily",
  analysisBySegmentId,
  setSaveError: setAnnotationError,
  selectSegment: () => {},
  stop: () => speech.stop(),
 });

 const [vocabSearchQuery, setVocabSearchQuery] = useState("");
 const {
  isSupported: isPipSupported,
  isOpen: isPipOpen,
  pipWindow,
  openPip,
  closePip,
 } = useDocumentPip();
 const [isInAppFloatingOpen, setIsInAppFloatingOpen] = useState(false);
 const [pipMode, setPipMode] = useState<UniversalPipMode>("vocab");

 const handleTogglePip = useCallback(
  async (targetMode: UniversalPipMode = "vocab") => {
   setPipMode(targetMode);
   if (isPipOpen) {
    if (pipMode === targetMode) {
     closePip();
    }
    return;
   }
   if (isInAppFloatingOpen) {
    if (pipMode === targetMode) {
     setIsInAppFloatingOpen(false);
    }
    return;
   }
   if (isPipSupported) {
    const win = await openPip({ width: 440, height: 380 });
    if (!win) {
     setIsInAppFloatingOpen(true);
    }
   } else {
    setIsInAppFloatingOpen(true);
   }
  },
  [
   closePip,
   isInAppFloatingOpen,
   isPipOpen,
   isPipSupported,
   openPip,
   pipMode,
   setIsInAppFloatingOpen,
  ],
 );

 const rawVocabItems =
  reading?.enrichment.vocabulary.status === "ready"
   ? reading.enrichment.vocabulary.data.items
   : null;
 const vocabItems = rawVocabItems ?? [];
 const pipVocabItems = customVocabListToHanziHomeVocabItems(
  vocabItems.map((item) => {
   const itemPronunciation = analyzeDailyReadingText(item.hanzi);
   return {
    id: item.id,
    hanzi: item.hanzi,
    pinyin: itemPronunciation ? formatContextualReadingPinyin(itemPronunciation) : "",
    meaning: item.meaningVi,
    pos: item.categoryVi,
    note: item.meaningInContextVi,
    createdAt: reading?.capturedAt ?? "",
   };
  }),
 );
 const pipPracticeItems = buildExercisesFromVocabItems(pipVocabItems);
 const trimmedVocabQuery = vocabSearchQuery.trim().toLowerCase();
 const filteredVocabItems = trimmedVocabQuery
  ? vocabItems.filter(
     (item) =>
      item.hanzi.toLowerCase().includes(trimmedVocabQuery) ||
      item.meaningVi.toLowerCase().includes(trimmedVocabQuery) ||
      item.categoryVi.toLowerCase().includes(trimmedVocabQuery) ||
      item.meaningInContextVi.toLowerCase().includes(trimmedVocabQuery),
    )
  : vocabItems;

 useEffect(() => {
  if (
   translationWorkflowRunId.length === 0 ||
   translationRunId.length === 0 ||
   streamArticleId.length === 0 ||
   streamArticleFingerprint.length === 0
  ) {
   return;
  }

  const controller = new AbortController();
  void (async () => {
   let startIndex = 0;
   while (!controller.signal.aborted) {
    try {
     const query = new URLSearchParams({ runId: translationRunId });
     if (startIndex > 0) query.set("startIndex", String(startIndex));
     const response = await fetch(`/api/daily-reading/enrichment-jobs/stream?${query.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
     });
     if (!response.ok || response.body === null) return;

     const reader = response.body.getReader();
     const decoder = new TextDecoder();
     let buffer = "";
     while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
       void reconcilePendingDailyReadingEnrichmentJobs().catch(() => undefined);
       return;
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
       if (line.trim().length === 0) continue;
       startIndex += 1;
       const payload: JsonFieldValue = JSON.parse(line);
       const parsed = dailyReadingTranslationProgressEventSchema.safeParse(payload);
       if (
        !parsed.success ||
        parsed.data.runId !== translationRunId ||
        parsed.data.articleId !== streamArticleId ||
        parsed.data.articleFingerprint !== streamArticleFingerprint
       ) {
        continue;
       }
       setTranslationProgressState((current) => {
        const events = current.runId === translationRunId ? current.events : [];
        const currentParagraphIds = new Set(
         events.flatMap((event) => event.paragraphs.map((paragraph) => paragraph.paragraphId)),
        );
        const paragraphs = parsed.data.paragraphs.filter(
         (paragraph) => !currentParagraphIds.has(paragraph.paragraphId),
        );
        return paragraphs.length === 0
         ? { runId: translationRunId, events }
         : { runId: translationRunId, events: [...events, { ...parsed.data, paragraphs }] };
       });
      }
     }
    } catch {
     if (controller.signal.aborted) return;
     await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
   }
  })();
  return () => controller.abort();
 }, [streamArticleFingerprint, streamArticleId, translationRunId, translationWorkflowRunId]);

 useEffect(() => {
  if (reading === null) return;
  const content = (
   <AppHeaderBreadcrumb
    aria-label="Daily Reading navigation"
    className="min-w-0 max-w-[min(44rem,78vw)]"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
     <AppHeaderBreadcrumbLink href="/daily-reading" title="Daily Reading">
      Daily Reading
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0 flex-1 truncate">
     <AppHeaderBreadcrumbPage title={reading.article.titleZh}>
      {reading.article.titleZh}
     </AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  );
  headerToolbarStore.actions.setOwnedContent("daily-reading-view", content);
  return () => {
   headerToolbarStore.actions.clearOwnedContent("daily-reading-view");
  };
 }, [reading]);

 if (reading === null || readerDocument === null) {
  return (
   <Card variant="subtle" padding="lg" className="grid gap-3">
    <Typography tone="danger">{t("generated.notFound")}</Typography>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     className="justify-self-start"
     onClick={onBack}
    >
     <ArrowLeft data-icon="inline-start" />
     {t("document.back")}
    </Button>
   </Card>
  );
 }

 const effectiveTab = tabs.includes(tab) ? tab : "reader";
 const learning = getDailyReadingLearningSummary(reading);
 return (
  <div className="grid min-w-0 gap-4">
   <header className="grid min-w-0 gap-3 border-b border-border-default pb-4 sm:pb-5">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
     {reading.classification.targetLevel !== null ? (
      <Badge variant="warning" size="sm" casing="natural">
       {reading.classification.targetLevel}
      </Badge>
     ) : null}
     <Badge size="sm" casing="natural">
      {t(getTopicTranslationKey(reading.classification.topic))}
     </Badge>
    </div>
    <div className="grid min-w-0 gap-1.5">
     {effectiveTab !== "reader" ? (
      <>
       <HanziText as="h1" size="card" weight="black">
        {reading.article.titleZh}
       </HanziText>
       {displayMode.showPinyin && titlePronunciation !== null ? (
        <PinyinText as="p" variant="bodySmall" tone="accent">
         {formatContextualReadingPinyin(titlePronunciation)}
        </PinyinText>
       ) : null}
       {translation !== null ? (
        <Typography variant="bodySmall" tone="secondary">
         {translation.titleVi}
        </Typography>
       ) : null}
      </>
     ) : null}
     <Typography variant="caption" tone="muted">
      {t("detail.capturedMeta", {
       time: dateFormatter.format(new Date(reading.capturedAt)),
       publisher: reading.source.publisher,
       minutes: reading.estimatedMinutes,
      })}
     </Typography>
     <Typography variant="caption" tone="muted">
      {t("library.learningReady", { ready: learning.ready, total: learning.total })}
     </Typography>
    </div>
   </header>

   <Tabs
    value={effectiveTab}
    items={tabItems}
    onValueChange={setTab}
    actions={
     <div className="flex shrink-0 items-center gap-1.5">
      <Button
       type="button"
       variant="ghost"
       size="compact"
       className="gap-1.5 shrink-0"
       onClick={onBack}
       title={t("document.back")}
      >
       <ArrowLeft className="size-3.5" />
       <span className="hidden sm:inline">{t("document.back")}</span>
      </Button>
     </div>
    }
    listClassName="hanzihome-liquid-toolbar flex sticky top-0 z-30 bg-background/95 backdrop-blur-md"
    aria-label={t("tabs.aria")}
   >
    <TabsContent value="reader" className="grid gap-3 pt-4">
     {latestTranslationProgress !== undefined && translation === null ? (
      <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
       <Badge
        variant={translationRun?.status === "failed" ? "warning" : "info"}
        size="sm"
        casing="natural"
       >
        {translationRun?.status === "failed"
         ? t("detail.temporaryTranslation")
         : t("detail.translationRunning")}
       </Badge>
       <Typography variant="bodySmall" tone="muted">
        {t("detail.translationProgress", {
         completed: latestTranslationProgress.progressCompleted,
         total: latestTranslationProgress.progressTotal,
        })}
       </Typography>
      </Card>
     ) : null}
     <Reader
      data={{
       ...readerDocument,
       segments: pronunciation.segments,
       ...(titlePronunciation
        ? { titlePinyin: formatContextualReadingPinyin(titlePronunciation) }
        : {}),
      }}
      display={{
       value: displayMode,
       onChange: (value) =>
        learningState.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...value } }),
      }}
      services={{
       speech,
       toolbar: {
        stickyOffset: "tabs",
        hidePinyinToggle: true,
        hideTranslationToggle: true,
       },
       annotations: {
        items: businessChineseReaderAnnotations(annotationsQuery.data ?? []),
        onOpen: (annotation, rect) => {
         const source = annotationsQuery.data?.find((item) => item.id === annotation.id);
         if (source) selection.handleOpenAnnotation(source, rect);
        },
        onSelection: (target) => {
         if (!readerDocument) return;
         const index = readerDocument.segments.findIndex((s) => s.id === target.segmentId);
         const segment = readerDocument.segments[index];
         if (segment) selection.handleSelection({ ...target, segment, index });
        },
       },
       lookup: (selection) => {
        void openInspector(selection.text, { anchorRect: selection.rect });
       },
       pronunciationReview: pronunciation.service,
      }}
     />
     {pronunciation.popover}
     {selection.popover}
    </TabsContent>

    <TabsContent value="notes" className="grid gap-4 pt-4">
     {annotationsQuery.data && annotationsQuery.data.length > 0 ? (
      <ReaderNotes annotations={annotationsQuery.data} onRemove={selection.removeAnnotation} />
     ) : null}
     <DailyReadingNoteCard reading={reading} />
    </TabsContent>

    <TabsContent value="support" className="pt-4">
     <DailyReadingLearningSupportPanel reading={reading} />
    </TabsContent>

    <TabsContent value="questions" className="pt-4">
     <Questions reading={reading} />
    </TabsContent>

    <TabsContent value="vocabulary" className="pt-4">
     {reading.enrichment.vocabulary.status === "ready" ? (
      <div className="grid gap-3">
       <Card
        variant="subtle"
        padding="sm"
        className="flex min-w-0 flex-wrap items-center justify-between gap-2.5"
       >
        <div className="flex min-w-0 items-center gap-2">
         <Typography
          variant="caption"
          tone="muted"
          weight="bold"
          tracking="wide"
          transform="uppercase"
          className="hidden sm:inline"
         >
          {t("tabs.vocabulary")}
         </Typography>
         <Badge variant="default" casing="natural">
          {vocabItems.length} từ
         </Badge>
         <div className="relative min-w-[140px] sm:min-w-[200px]">
          <Input
           type="search"
           density="compact"
           adornment="start"
           value={vocabSearchQuery}
           onChange={(e) => setVocabSearchQuery(e.target.value)}
           placeholder="Tìm từ vựng..."
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
         </div>
         {vocabSearchQuery ? (
          <Typography variant="caption" tone="secondary">
           ({filteredVocabItems.length} kết quả)
          </Typography>
         ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
         <Button
          type="button"
          size="compact"
          variant={
           (isPipOpen || isInAppFloatingOpen) && pipMode === "dictation" ? "active" : "outline"
          }
          onClick={() => void handleTogglePip("dictation")}
          title="Mở cửa sổ nổi nghe chép từ vựng (hỗ trợ nghe tiếng Trung hoặc nghe tiếng Việt)"
         >
          <Volume2 className="size-3.5" />
          <span>Chép từ vựng</span>
         </Button>
         <Button
          type="button"
          size="compact"
          variant={(isPipOpen || isInAppFloatingOpen) && pipMode === "vocab" ? "active" : "outline"}
          onClick={() => void handleTogglePip("vocab")}
          title="Mở cửa sổ nổi ôn tập từ vựng & bài tập"
         >
          <PictureInPicture2 className="size-3.5" />
          <span>Mở PiP</span>
         </Button>
        </div>
       </Card>

       {filteredVocabItems.length === 0 && vocabSearchQuery ? (
        <Card variant="subtle" padding="lg" className="text-center">
         <Typography variant="bodySmall" tone="muted">
          Không tìm thấy từ vựng nào khớp với &ldquo;{vocabSearchQuery}&rdquo;
         </Typography>
        </Card>
       ) : null}

       <div className="grid gap-2 sm:grid-cols-2">
        {filteredVocabItems.map((item) => {
         const itemPronunciation = analyzeDailyReadingText(item.hanzi);
         const resolvedPinyin =
          itemPronunciation !== null ? formatContextualReadingPinyin(itemPronunciation) : "";
         return (
          <VocabPreviewRow
           key={item.id}
           hanzi={item.hanzi}
           pinyin={resolvedPinyin}
           hanviet=""
           category={item.categoryVi}
           meaning={displayMode.showMeaning ? item.meaningVi : ""}
           rawMeaning={item.meaningVi}
           header={
            <div className="flex min-w-0 flex-wrap items-center gap-2">
             <HanziText as="span" size="card" weight="black" leading="none">
              {item.hanzi}
             </HanziText>
             {displayMode.showPinyin && resolvedPinyin ? (
              <PinyinText as="span" tone="accent" weight="bold">
               {resolvedPinyin}
              </PinyinText>
             ) : null}
             <MandarinSpeakButton text={item.hanzi} />
            </div>
           }
          >
           {displayMode.showMeaning && item.meaningInContextVi ? (
            <Typography variant="caption" tone="muted">
             {t("generated.vocabulary.inContext", { meaning: item.meaningInContextVi })}
            </Typography>
           ) : null}
          </VocabPreviewRow>
         );
        })}
       </div>
      </div>
     ) : null}
    </TabsContent>

    <TabsContent value="grammar" className="pt-4">
     {reading.enrichment.grammar.status === "ready" ? (
      <div className="grid gap-3">
       {reading.enrichment.grammar.data.items.map((grammar, index) => (
        <Card key={grammar.id} variant="section" padding="md" className="grid gap-2">
         <div className="flex items-center gap-2">
          <Badge variant="warning">{index + 1}</Badge>
          <HanziText as="h3" size="medium" weight="black">
           {grammar.patternZh}
          </HanziText>
         </div>
         <Typography variant="bodySmall" tone="secondary">
          {grammar.explanationVi}
         </Typography>
         <HanziText as="p" size="medium" leading="relaxed">
          {grammar.evidenceSentenceZh}
         </HanziText>
        </Card>
       ))}
      </div>
     ) : null}
    </TabsContent>

    <TabsContent value="source" className="pt-4">
     <Card variant="subtle" padding="md" className="grid gap-3">
      <div className="grid min-w-0 gap-1">
       <HanziText as="h3" size="medium" weight="black">
        {reading.source.titleZh}
       </HanziText>
       <Typography variant="bodySmall" tone="muted">
        {reading.source.publisher} · {dateFormatter.format(new Date(reading.source.publishedAt))}
       </Typography>
      </div>
      {reading.provenance === "legacy-adapted" && translation?.adaptationNoticeVi ? (
       <Typography variant="bodySmall" tone="secondary">
        {translation.adaptationNoticeVi}
       </Typography>
      ) : (
       <Typography variant="bodySmall" tone="muted">
        {t("source.fallbackNotice")}
       </Typography>
      )}
      <Button type="button" variant="outline" size="toolbar" asChild className="justify-self-start">
       <a href={reading.source.url} target="_blank" rel="noreferrer">
        {t("generated.source.open")}
       </a>
      </Button>
     </Card>
    </TabsContent>
   </Tabs>
   {isPipOpen && pipWindow
    ? createPortal(
       <UniversalAmbientPip
        initialMode={pipMode}
        lessonTitle={reading.article.titleZh}
        vocabItems={pipVocabItems}
        practiceItems={pipPracticeItems}
        onClose={closePip}
       />,
       pipWindow.document.body,
      )
    : null}
   {isInAppFloatingOpen ? (
    <UniversalAmbientPip
     initialMode={pipMode}
     lessonTitle={reading.article.titleZh}
     vocabItems={pipVocabItems}
     practiceItems={pipPracticeItems}
     onClose={() => setIsInAppFloatingOpen(false)}
     isFloatingInApp
    />
   ) : null}
  </div>
 );
}
