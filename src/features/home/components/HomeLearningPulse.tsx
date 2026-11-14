import type { ComponentProps, ReactNode } from "react";
import { Bookmark, CheckCircle2, FileText, History, Repeat2, Workflow } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import type { HomeDashboardModel } from "@/features/home/types";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function HomeLearningPulse({
 pulse,
 onRetryOverview,
 onRetryReviewedToday,
}: {
 pulse: HomeDashboardModel["learningPulse"];
 onRetryOverview: HomeDashboardModel["retryLearningOverview"];
 onRetryReviewedToday: HomeDashboardModel["retryReviewedToday"];
}) {
 const t = useTranslations("Home");
 const common = useTranslations("Common");

 return (
  <section
   aria-labelledby="home-learning-pulse-title"
   aria-busy={pulse.overviewLoading || pulse.reviewedTodayLoading}
  >
   <Card variant="section" padding="lg" className="grid gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid min-w-0 gap-1">
      <Typography
       id="home-learning-pulse-title"
       as="h2"
       variant="sectionTitle"
       tone="default"
       weight="black"
      >
       {t("pulse.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("pulse.description")}
      </Typography>
     </div>
     <Button variant="outline" size="toolbar" asChild>
      <Link href="/dictionary">
       <Repeat2 data-icon="inline-start" />
       {t("pulse.openSrs")}
      </Link>
     </Button>
    </div>

    <div className="grid divide-y divide-border-default/70">
     <PulseStat
      icon={<Repeat2 />}
      value={pulse.reviewCount}
      label={t("pulse.reviewCount")}
      tone="warning"
     />
     <PulseStat
      icon={<Repeat2 />}
      value={pulse.overviewAvailable ? pulse.srsDueCount : "—"}
      label={t("pulse.srsDueCount")}
      tone="warning"
     />
     <PulseStat
      icon={<Workflow />}
      value={pulse.overviewAvailable ? pulse.learningLoopDueCount : "—"}
      label={t("pulse.learningLoopDueCount")}
      tone="accent"
     />
    </div>

    <Separator />

    <div className="grid gap-x-5 gap-y-1 sm:grid-cols-2">
     <PulseStat
      icon={<CheckCircle2 />}
      value={pulse.knownCount}
      label={t("pulse.knownCount")}
      tone="info"
     />
     <PulseStat
      icon={<History />}
      value={pulse.reviewedTodayAvailable ? pulse.reviewedTodayCount : "—"}
      label={t("pulse.reviewedTodayCount")}
      tone="accent"
     />
     <PulseStat
      icon={<Bookmark />}
      value={pulse.bookmarkedCount}
      label={t("pulse.bookmarkedCount")}
      tone="neutral"
     />
     <PulseStat
      icon={<FileText />}
      value={
       pulse.overviewAvailable ? `${pulse.readerCompletedCount}/${pulse.readerDocumentCount}` : "—"
      }
      label={t("pulse.readerCompletedCount")}
      tone="info"
     />
    </div>

    <Typography as="p" variant="caption" tone="muted">
     {pulse.trackedCount > 0 ? t("pulse.tracked", { count: pulse.trackedCount }) : t("pulse.empty")}
    </Typography>
    {pulse.overviewLoading ? (
     <Typography as="p" variant="caption" tone="muted">
      {t("pulse.overviewLoading")}
     </Typography>
    ) : null}
    {pulse.overviewUnavailable ? (
     <QueryErrorCard
      title={t("pulse.overviewErrorTitle")}
      description={t("pulse.unavailable")}
      retryLabel={common("actions.retry")}
      onRetry={onRetryOverview}
     />
    ) : null}
    {pulse.reviewedTodayLoading ? (
     <Typography as="p" variant="caption" tone="muted">
      {t("pulse.reviewedTodayLoading")}
     </Typography>
    ) : null}
    {pulse.reviewedTodayUnavailable ? (
     <QueryErrorCard
      title={t("pulse.reviewedTodayErrorTitle")}
      description={t("pulse.reviewedTodayErrorDescription")}
      retryLabel={common("actions.retry")}
      onRetry={onRetryReviewedToday}
     />
    ) : null}
   </Card>
  </section>
 );
}

function PulseStat({
 icon,
 value,
 label,
 tone,
}: {
 icon: ReactNode;
 value: number | string;
 label: string;
 tone: NonNullable<ComponentProps<typeof IconTile>["tone"]>;
}) {
 return (
  <div className="flex min-w-0 items-center gap-3 py-2 first:pt-0 last:pb-0">
   <IconTile size="sm" tone={tone}>
    {icon}
   </IconTile>
   <Typography as="p" variant="caption" tone="muted" className="min-w-0 flex-1">
    {label}
   </Typography>
   <Typography as="p" variant="label" tone="default" weight="black" className="shrink-0">
    {value}
   </Typography>
  </div>
 );
}
