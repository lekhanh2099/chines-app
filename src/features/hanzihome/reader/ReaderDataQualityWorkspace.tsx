"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { fetchReaderDataQualityReport } from "./reader-data-quality-api";

type CountKey =
 | "documents"
 | "paragraphs"
 | "vocabularyLinks"
 | "exerciseGroups"
 | "exerciseItems"
 | "assets";

const countKeys: ReadonlyArray<CountKey> = [
 "documents",
 "paragraphs",
 "vocabularyLinks",
 "exerciseGroups",
 "exerciseItems",
 "assets",
];

export function ReaderDataQualityWorkspace() {
 const t = useTranslations("ReaderDataQuality");
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.readerDataQuality,
  queryFn: fetchReaderDataQualityReport,
  staleTime: 0,
 });

 return (
  <div className="grid min-w-0 gap-5">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     {t("title")}
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     {t("description")}
    </Typography>
   </div>
   {query.isPending ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="muted">
      {t("loading")}
     </Typography>
    </Card>
   ) : null}
   {query.isError ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="danger">
      {query.error.message}
     </Typography>
    </Card>
   ) : null}
   {query.data ? (
    <>
     <Card variant="section" padding="md" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <Typography as="h2" variant="sectionTitle" weight="black">
        {t("publishedContent")}
       </Typography>
       <Badge variant={query.data.issues.length === 0 ? "success" : "warning"}>
        {query.data.issues.length === 0
         ? t("healthy")
         : t("warnings", { count: query.data.issues.length })}
       </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
       {countKeys.map((key) => (
        <Card key={key} variant="subtle" padding="sm" className="grid gap-1">
         <Typography variant="caption" tone="muted">
          {t(`counts.${key}`)}
         </Typography>
         <Typography variant="sectionTitle" weight="black">
          {query.data[key]}
         </Typography>
        </Card>
       ))}
      </div>
     </Card>
     <Card variant="subtle" padding="md" className="grid gap-2">
      <Typography as="h2" variant="cardTitle" weight="black">
       {t("byKind")}
      </Typography>
      {query.data.publishedKinds.map((item) => (
       <Typography key={item.kind} variant="bodySmall">
        {item.kind}: {item.count}
       </Typography>
      ))}
      {query.data.issues.map((issue) => (
       <Typography key={issue} variant="bodySmall" tone="danger">
        {issue}
       </Typography>
      ))}
     </Card>
     <Button type="button" variant="outline" onClick={() => void query.refetch()}>
      {t("runAgain")}
     </Button>
    </>
   ) : null}
  </div>
 );
}
