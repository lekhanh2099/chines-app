"use client";

import { Fragment, memo } from "react";
import { useTranslations } from "next-intl";

import { LearnerHanziText } from "@/components/patterns/learner-text";
import { Typography } from "@/components/ui/display/typography";
import { cn } from "@/lib/utils";
import { useReaderDisplay, useReaderSelector, useReaderServices } from "../runtime/reader-context";
import { ReaderSegment } from "./ReaderSegment";
import { getReaderTypographyStyle } from "./reader-typography";
import { useReaderContentPositionSync } from "../runtime/use-reader-position-sync";

export const ReaderContent = memo(function ReaderContent() {
 const t = useTranslations("Reader.study.chrome.surface");
 const content = useReaderSelector((state) => state.content);
 const { value: display } = useReaderDisplay();
 const { renderSection, compactContent } = useReaderServices();
 useReaderContentPositionSync();
 const grouped = new Set(
  content.sectionIds.flatMap((id) => content.sectionsById[id]?.segmentIds ?? []),
 );
 return (
  <div className={cn("grid min-w-0", compactContent ? "gap-2" : "gap-4")} data-reader-content>
   {content.title ? (
    <header
     className={cn("grid min-w-0", compactContent ? "sr-only gap-1 sm:not-sr-only" : "gap-2")}
    >
     {content.title.zh ? (
      <LearnerHanziText
       as="h2"
       size="title"
       wrapping="breakWords"
       style={getReaderTypographyStyle(display, { size: "lg" })}
      >
       {content.title.zh}
      </LearnerHanziText>
     ) : null}
     {display.showPinyin && content.title.pinyin ? (
      <Typography lang="zh-Latn-pinyin" tone="muted" wrapping="breakWords">
       {content.title.pinyin}
      </Typography>
     ) : null}
     {display.showMeaning && content.title.vi ? (
      <Typography wrapping="breakWords">{content.title.vi}</Typography>
     ) : null}
    </header>
   ) : null}
   {content.segmentIds.length === 0 ? <Typography tone="muted">{t("empty")}</Typography> : null}
   {content.sectionIds.map((id) => {
    const section = content.sectionsById[id];
    if (!section) return null;
    const sectionContent = (
     <section
      className={cn("grid min-w-0", compactContent ? "gap-2" : "gap-3")}
      data-reader-section={id}
     >
      <Typography
       as="h3"
       variant="sectionTitle"
       wrapping="breakWords"
       className={compactContent ? "sr-only sm:not-sr-only" : undefined}
      >
       {section.title}
      </Typography>
      {section.segmentIds.map((segmentId) => (
       <ReaderSegment key={segmentId} segmentId={segmentId} />
      ))}
     </section>
    );
    return (
     <Fragment key={id}>
      {renderSection ? renderSection({ section, content: sectionContent }) : sectionContent}
     </Fragment>
    );
   })}
   {content.segmentIds
    .filter((id) => !grouped.has(id))
    .map((segmentId) => (
     <ReaderSegment key={segmentId} segmentId={segmentId} />
    ))}
  </div>
 );
});
