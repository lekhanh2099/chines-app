"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";

import type { useTranslationAttempts } from "./useTranslationAttempts";

export function TranslationAttemptHistory({
 historyQuery,
}: {
 historyQuery: ReturnType<typeof useTranslationAttempts>["historyQuery"];
}) {
 const t = useTranslations("HumanitiesPractice");

 return (
  <>
   {historyQuery.isPending ? (
    <Typography as="p" variant="caption" tone="muted" role="status">
     {t("detail.historyLoading")}
    </Typography>
   ) : null}
   {historyQuery.isError ? (
    <QueryErrorCard
     title={t("detail.historyError")}
     description={t("detail.historyErrorHelp")}
     retryLabel={t("detail.historyRetry")}
     onRetry={() => {
      void historyQuery.refetch();
     }}
    />
   ) : null}
   {historyQuery.data && historyQuery.data.length > 0 ? (
    <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
     <Typography as="p" variant="caption" tone="muted" weight="black">
      {t("detail.history", { count: historyQuery.data.length })}
     </Typography>
     {historyQuery.data.slice(0, 3).map((attempt) => (
      <Badge key={attempt.id}>
       {attempt.score === null ? t("detail.review") : `${Math.round(attempt.score * 100)}/100`}
      </Badge>
     ))}
    </Card>
   ) : null}
  </>
 );
}
