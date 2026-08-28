"use client";

import { ArrowLeft, FileText, History, Search, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 analyzeContextualPronunciation,
 formatContextualSpokenPinyin,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { JsonFieldValue } from "@/types/json";

import { ReaderSurface } from "../components/ReaderSurface";
import { DailyReadingLearningSupportPanel } from "./DailyReadingLearningSupportPanel";
import { DailyReadingActivityLog } from "./DailyReadingActivityLog";
import type { DailyReadingTopic } from "./daily-reading.schemas";
import {
 captureDailyReadingNow,
 useDailyReadingLibrary,
 useDailyReadingSettings,
} from "./daily-reading.client";
import {
 enrichDailyReadingLearningSupport,
 reconcilePendingDailyReadingEnrichmentJobs,
} from "./daily-reading-enrichment.client";
import {
 dailyReadingTranslationProgressEventSchema,
 type DailyReadingTranslationProgressEvent,
} from "./daily-reading-enrichment.schemas";
import type { DailyReading } from "./daily-reading.schemas";
import {
 buildDailyReadingActivityEntries,
 buildDailyReadingReaderDocument,
 getDailyReadingLearningSummary,
} from "./daily-reading-view-model";
import { resolveDailyReadingReleaseState } from "./daily-reading.scheduler";

type LibraryView = "articles" | "activity";
type DailyReadingTab = "reader" | "support" | "questions" | "vocabulary" | "grammar" | "source";
type DailyReadingTabTranslationKey =
 | "tabs.reader"
 | "detail.supportTab"
 | "tabs.questions"
 | "tabs.vocabulary"
 | "tabs.grammar"
 | "tabs.source";

const fallbackTabs: readonly DailyReadingTab[] = ["reader", "support", "source"];
const contextualPronunciationMaximumCharacters = 2_000;

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
 const tabs: DailyReadingTab[] = ["reader", "support"];
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
    aria-label={t("library.tabs.aria")}
   >
    <TabsContent value="articles" className="pt-4">
     {library.items.length === 0 ? (
      <Card variant="subtle" padding="lg" className="grid gap-2">
       <Typography weight="bold">{t("empty.title")}</Typography>
       <Typography variant="bodySmall" tone="muted">
        {t("library.description")}
       </Typography>
      </Card>
     ) : (
      <div className="grid gap-3">
       {library.items.slice(0, 30).map((reading) => {
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
       })}
      </div>
     )}
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
 const dateFormatter = useMemo(
  () =>
   new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
   }),
  [locale],
 );

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
     const response = await fetch(
      `/api/hanzihome/reader/daily-reading/enrichment-jobs/stream?${query.toString()}`,
      { cache: "no-store", signal: controller.signal },
     );
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
   <Button
    type="button"
    variant="ghost"
    size="toolbar"
    className="justify-self-start"
    onClick={onBack}
   >
    <ArrowLeft data-icon="inline-start" />
    {t("document.back")}
   </Button>

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
     <HanziText as="h1" size="card" weight="black">
      {reading.article.titleZh}
     </HanziText>
     {displayMode.showPinyin && titlePronunciation !== null ? (
      <PinyinText as="p" variant="bodySmall" tone="accent">
       {formatContextualSpokenPinyin(titlePronunciation)}
      </PinyinText>
     ) : null}
     {translation !== null ? (
      <Typography variant="bodySmall" tone="secondary">
       {translation.titleVi}
      </Typography>
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

   <Tabs value={effectiveTab} items={tabItems} onValueChange={setTab} aria-label={t("tabs.aria")}>
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
     <ReaderSurface document={readerDocument} toolbarStickyOffset="tabs" />
    </TabsContent>

    <TabsContent value="support" className="pt-4">
     <DailyReadingLearningSupportPanel reading={reading} />
    </TabsContent>

    <TabsContent value="questions" className="pt-4">
     <Questions reading={reading} />
    </TabsContent>

    <TabsContent value="vocabulary" className="pt-4">
     {reading.enrichment.vocabulary.status === "ready" ? (
      <div className="grid gap-3 sm:grid-cols-2">
       {reading.enrichment.vocabulary.data.items.map((item) => {
        const pronunciation = analyzeDailyReadingText(item.hanzi);
        return (
         <Card key={item.id} variant="section" padding="md" className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
           <HanziText as="h3" size="medium" weight="black">
            {item.hanzi}
           </HanziText>
           <Badge size="sm">{item.categoryVi}</Badge>
          </div>
          {displayMode.showPinyin && pronunciation !== null ? (
           <PinyinText as="p" variant="caption" tone="accent">
            {formatContextualSpokenPinyin(pronunciation)}
           </PinyinText>
          ) : null}
          <Typography variant="bodySmall" weight="semibold">
           {item.meaningVi}
          </Typography>
          <Typography variant="bodySmall" tone="muted">
           {t("generated.vocabulary.inContext", { meaning: item.meaningInContextVi })}
          </Typography>
         </Card>
        );
       })}
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
  </div>
 );
}
