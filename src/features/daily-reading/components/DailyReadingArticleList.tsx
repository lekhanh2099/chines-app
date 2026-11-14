"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link } from "@/i18n/navigation";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";
import { getDailyReadingLearningSummary } from "@/features/daily-reading/model/daily-reading-view-model";
import {
 getTopicTranslationKey,
 learningStatusVariant,
} from "@/features/daily-reading/components/daily-reading-library-utils";

type DailyReadingArticleListProps = {
 libraryCount: number;
 filteredArticles: readonly DailyReading[];
 articleSearchQuery: string;
 onArticleSearchQueryChange(value: string): void;
 capturing: boolean;
 onCapture(): void;
 readingHref(id: string): string;
 dateFormatter: Intl.DateTimeFormat;
};

export function DailyReadingArticleList({
 libraryCount,
 filteredArticles,
 articleSearchQuery,
 onArticleSearchQueryChange,
 capturing,
 onCapture,
 readingHref,
 dateFormatter,
}: DailyReadingArticleListProps) {
 const t = useTranslations("DailyReading");
 return (
  <div className="grid gap-3">
   {libraryCount > 0 ? (
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
       {libraryCount} bài
      </Badge>
      <div className="relative min-w-[150px] sm:min-w-[220px]">
       <Input
        type="search"
        density="compact"
        adornment="start"
        value={articleSearchQuery}
        onChange={(e) => onArticleSearchQueryChange(e.target.value)}
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
      <Button type="button" size="toolbar" onClick={onCapture} disabled={capturing}>
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

   {libraryCount === 0 ? (
    <Card variant="subtle" padding="lg" className="grid gap-2">
     <Typography weight="bold">{t("empty.title")}</Typography>
     <Typography variant="bodySmall" tone="muted">
      {t("library.description")}
     </Typography>
    </Card>
   ) : (
    filteredArticles
     .slice(0, 30)
     .map((reading) => (
      <DailyReadingArticleCard
       key={reading.id}
       reading={reading}
       href={readingHref(reading.id)}
       dateFormatter={dateFormatter}
      />
     ))
   )}
  </div>
 );
}

function DailyReadingArticleCard({
 reading,
 href,
 dateFormatter,
}: {
 reading: DailyReading;
 href: string;
 dateFormatter: Intl.DateTimeFormat;
}) {
 const t = useTranslations("DailyReading");
 const translation =
  reading.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
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
  <Card asChild variant="interactive" padding="md" className="group min-w-0">
   <Link href={href} prefetch={false}>
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
}
