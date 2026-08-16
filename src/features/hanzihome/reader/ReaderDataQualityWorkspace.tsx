"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

import { fetchReaderDataQualityReport } from "./reader-data-quality-api";

type CountKey =
 | "documents"
 | "paragraphs"
 | "vocabularyLinks"
 | "exerciseGroups"
 | "exerciseItems"
 | "assets";

const countLabels: Array<readonly [CountKey, string]> = [
 ["documents", "Documents"],
 ["paragraphs", "Paragraphs"],
 ["vocabularyLinks", "Vocab links"],
 ["exerciseGroups", "Exercise groups"],
 ["exerciseItems", "Exercise items"],
 ["assets", "Assets"],
];

export function ReaderDataQualityWorkspace() {
 const query = useQuery({
  queryKey: ["hanzihome", "reader", "data-quality"],
  queryFn: fetchReaderDataQualityReport,
  staleTime: 0,
 });

 return (
  <div className="grid min-w-0 gap-5">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     Reader Data Quality
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     Audit runtime content references trước khi parity/cutover.
    </Typography>
   </div>
   {query.isPending ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="muted">
      Đang kiểm tra dữ liệu…
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
        Published content
       </Typography>
       <Badge variant={query.data.issues.length === 0 ? "success" : "warning"}>
        {query.data.issues.length === 0
         ? "Không có orphan"
         : `${query.data.issues.length} cảnh báo`}
       </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
       {countLabels.map(([key, label]) => (
        <Card key={key} variant="subtle" padding="sm" className="grid gap-1">
         <Typography variant="caption" tone="muted">
          {label}
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
       Theo kind
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
      Chạy lại audit
     </Button>
    </>
   ) : null}
  </div>
 );
}
