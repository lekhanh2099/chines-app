"use client";

import { FileText, History, Search, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Typography } from "@/components/ui/display/typography";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { DailyReadingActivityLog } from "@/features/daily-reading/components/DailyReadingActivityLog";
import { DailyReadingArticleList } from "@/features/daily-reading/components/DailyReadingArticleList";
import {
 filterDailyReadingArticles,
 type LibraryView,
} from "@/features/daily-reading/components/daily-reading-library-utils";
import {
 captureDailyReadingNow,
 useDailyReadingLibrary,
 useDailyReadingSettings,
} from "@/features/daily-reading/services/daily-reading.client";
import { enrichDailyReadingLearningSupport } from "@/features/daily-reading/enrichment/daily-reading-enrichment.client";
import { buildDailyReadingActivityEntries } from "@/features/daily-reading/model/daily-reading-view-model";
import { resolveDailyReadingReleaseState } from "@/features/daily-reading/model/daily-reading.scheduler";

export { DailyReadingView } from "@/features/daily-reading/components/DailyReadingView";

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
 const filteredArticles = useMemo(
  () => filterDailyReadingArticles(library.items, articleSearchQuery),
  [library.items, articleSearchQuery],
 );

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

   <DailyReadingLibraryStatus
    todayStatus={todayStatus}
    scheduleLabel={
     settings.autoCaptureEnabled
      ? t("library.status.scheduleEnabled", { time: captureTime })
      : t("library.status.scheduleDisabled")
    }
    libraryCount={library.items.length}
   />

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
     <DailyReadingArticleList
      libraryCount={library.items.length}
      filteredArticles={filteredArticles}
      articleSearchQuery={articleSearchQuery}
      onArticleSearchQueryChange={setArticleSearchQuery}
      capturing={capturing}
      onCapture={() => void captureArticle()}
      readingHref={readingHref}
      dateFormatter={dateFormatter}
     />
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

function DailyReadingLibraryStatus({
 todayStatus,
 scheduleLabel,
 libraryCount,
}: {
 todayStatus: string;
 scheduleLabel: string;
 libraryCount: number;
}) {
 const t = useTranslations("DailyReading");
 return (
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
    <Typography weight="semibold">{scheduleLabel}</Typography>
   </div>
   <div className="grid min-w-0 gap-1">
    <Typography variant="caption" tone="muted" weight="bold">
     {t("library.status.libraryLabel")}
    </Typography>
    <Typography weight="semibold">
     {t("settings.capture.libraryCount", { count: libraryCount })}
    </Typography>
   </div>
  </Card>
 );
}
