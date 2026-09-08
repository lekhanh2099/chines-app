"use client";

import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

import type { ReaderDocumentModel } from "../model/reader-document.types";
import {
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";

export const ReaderOutline = memo(function ReaderOutline({
 document,
}: {
 document: ReaderDocumentModel;
}) {
 return (
  <Card variant="section" padding="md" className="sticky top-3">
   <ReaderOutlineContent document={document} />
  </Card>
 );
});

export function ReaderOutlineContent({
 document,
 onNavigate,
}: {
 document: ReaderDocumentModel;
 onNavigate?: () => void;
}) {
 const t = useTranslations("Reader.study.chrome.outline");
 const commands = useReaderRuntimeCommands();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const activeSegment = document.segments[activeIndex];
 const indexById = useMemo(
  () => new Map(document.segments.map((segment, index) => [segment.id, index])),
  [document.segments],
 );

 return (
  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
   <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
    <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
     {t("segments")}
    </Typography>
    <nav aria-label={t("aria")} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
     {document.sections.length > 0
      ? document.sections.map((section, index) => {
         const firstSegmentId = section.segmentIds[0];
         const targetIndex = firstSegmentId ? indexById.get(firstSegmentId) : undefined;
         const selected = Boolean(
          activeSegment?.sectionId && activeSegment.sectionId === section.id,
         );
         return targetIndex === undefined ? null : (
          <Button
           key={section.id}
           type="button"
           variant={selected ? "active" : "ghost"}
           size="menu"
           align="start"
           className="w-full"
           onClick={() => {
            commands.selectIndex(targetIndex);
            onNavigate?.();
           }}
          >
           <span className="tabular-nums">{index + 1}</span>
           <span className="min-w-0 truncate">{section.title}</span>
          </Button>
         );
        })
      : document.segments.map((segment, index) => (
         <Button
          key={segment.id}
          type="button"
          variant={activeIndex === index ? "active" : "ghost"}
          size="menu"
          align="start"
          className="w-full"
          onClick={() => {
           commands.selectIndex(index);
           onNavigate?.();
          }}
         >
          <span className="tabular-nums">{index + 1}</span>
          <span>{t("segment", { number: index + 1 })}</span>
         </Button>
        ))}
    </nav>
   </div>

   {document.metadata.length > 0 ? (
    <>
     <Separator />
     <div className="grid gap-3">
      <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
       {t("metadata")}
      </Typography>
      <dl className="grid gap-3">
       {document.metadata.map((item) => (
        <div key={item.id} className="grid gap-0.5">
         <Typography as="dt" variant="caption" tone="muted">
          {item.label}
         </Typography>
         <Typography as="dd" variant="bodySmall" tone="default">
          {item.value}
         </Typography>
        </div>
       ))}
      </dl>
     </div>
    </>
   ) : null}
  </div>
 );
}
