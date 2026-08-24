"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { PinyinText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { formatContextualReading } from "@/features/hanzihome/pronunciation/contextual-pronunciation";

import type { ReaderSurfacePronunciationTarget } from "./ReaderDocumentContent";

export type ReaderPronunciationSaveInput = {
 text: string;
 readings: readonly string[];
 start: number;
 end: number;
};

type ReaderPronunciationSaveScope = "persistent" | "session";

type ReviewRange = {
 text: string;
 start: number;
 end: number;
 glyphs: ReaderSurfacePronunciationTarget["analysis"]["glyphs"];
};

function resolveReviewRange(target: ReaderSurfacePronunciationTarget): ReviewRange {
 const token = target.analysis.tokens.find(
  (item) =>
   item.type === "hanzi" && item.start <= target.glyph.start && item.end >= target.glyph.end,
 );
 const start = token?.start ?? target.glyph.start;
 const end = token?.end ?? target.glyph.end;
 const glyphs = target.analysis.glyphs.filter((glyph) => glyph.start >= start && glyph.end <= end);
 return {
  text: target.segment.zh.slice(start, end) || target.glyph.text,
  start,
  end,
  glyphs: glyphs.length > 0 ? glyphs : [target.glyph],
 };
}

function reviewStatus(
 review: ReviewRange,
 confirmed: boolean,
 saveScope: ReaderPronunciationSaveScope,
 t: ReturnType<typeof useTranslations>,
) {
 if (confirmed) return saveScope === "session" ? t("appliedSession") : t("confirmed");
 if (review.glyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))) {
  return t("source");
 }
 if (review.glyphs.every((glyph) => glyph.evidence.includes("dictionary-exact"))) {
  return t("dictionary");
 }
 if (
  review.glyphs.some(
   (glyph) =>
    glyph.isPolyphonic &&
    !glyph.evidence.includes("manual-override") &&
    !glyph.evidence.includes("source-pinyin") &&
    !glyph.evidence.includes("dictionary-exact"),
  )
 ) {
  return t("needsReview");
 }
 return t("context");
}

function initialReadings(review: ReviewRange) {
 return Object.fromEntries(
  review.glyphs.flatMap((glyph) => {
   const reading = glyph.lexicalReadingKey ?? glyph.spokenReadingKey;
   return reading ? [[String(glyph.start), reading]] : [];
  }),
 );
}

type ReviewReadingsState = {
 key: string;
 values: Record<string, string>;
};

export function ReaderPronunciationReviewPopover({
 target,
 confirmed = false,
 meaning,
 saveScope = "persistent",
 onClose,
 onSave,
 onReset,
}: {
 target: ReaderSurfacePronunciationTarget;
 confirmed?: boolean;
 meaning?: string;
 saveScope?: ReaderPronunciationSaveScope;
 onClose: () => void;
 onSave?: (input: ReaderPronunciationSaveInput) => void;
 onReset?: () => void;
}) {
 const t = useTranslations("Reader.study.chrome.pronunciation");
 const review = useMemo(() => resolveReviewRange(target), [target]);
 const reviewKey = `${target.segment.id}:${review.start}:${review.end}`;
 const [readingsState, setReadingsState] = useState<ReviewReadingsState>(() => ({
  key: reviewKey,
  values: initialReadings(review),
 }));
 const readings = readingsState.key === reviewKey ? readingsState.values : initialReadings(review);
 const status = reviewStatus(review, confirmed, saveScope, t);
 const anchor = useCallback(
  () => ({ getBoundingClientRect: () => target.rect, contextElement: document.body }),
  [target.rect],
 );
 const saveReadings = review.glyphs.map((glyph) => readings[String(glyph.start)] ?? "");
 const canSave = Boolean(onSave) && saveReadings.every((reading) => reading.length > 0);

 return (
  <Popover.Root open modal={false} onOpenChange={(open) => !open && onClose()}>
   <Popover.Portal>
    <BasePopoverPositioner
     anchor={anchor}
     side="top"
     align="center"
     sideOffset={10}
     collisionPadding={12}
     positionMethod="fixed"
    >
     <BasePopoverPopup variant="lookup" data-no-inspector initialFocus={false} finalFocus={false}>
      <div className="grid gap-3 p-3">
       <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
         <Typography as="strong" variant="sectionTitle" lang="zh-CN" clamp="one">
          {review.text}
         </Typography>
         <PinyinText variant="bodySmall" tone="muted">
          {review.glyphs
           .map((glyph) => glyph.lexicalPinyin ?? glyph.spokenPinyin)
           .filter((value): value is string => Boolean(value))
           .join(" ") || t("missing")}
         </PinyinText>
        </div>
        <Badge variant={confirmed ? "success" : "warning"} casing="natural">
         {status}
        </Badge>
       </div>

       {meaning ? (
        <Typography variant="bodySmall" tone="muted">
         {meaning}
        </Typography>
       ) : null}

       <div className="grid gap-1.5">
        <Typography variant="caption" tone="muted" weight="semibold">
         {t("choose")}
        </Typography>
        {review.glyphs.map((glyph) => {
         const choices = [
          ...new Set(
           [glyph.lexicalReadingKey, ...glyph.alternatives].filter((value): value is string =>
            Boolean(value),
           ),
          ),
         ];
         const selected = readings[String(glyph.start)];
         return (
          <div
           key={`${glyph.start}:${glyph.end}`}
           className="flex min-w-0 flex-wrap items-center gap-2"
          >
           <Typography as="span" variant="sectionTitle" lang="zh-CN">
            {glyph.text}
           </Typography>
           {choices.length > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-1.5" role="group" aria-label={glyph.text}>
             {choices.map((readingKey) => (
              <Button
               key={readingKey}
               type="button"
               size="sm"
               variant={selected === readingKey ? "active" : "outline"}
               aria-pressed={selected === readingKey}
               onClick={() =>
                setReadingsState((current) => ({
                 key: reviewKey,
                 values: {
                  ...(current.key === reviewKey ? current.values : initialReadings(review)),
                  [String(glyph.start)]: readingKey,
                 },
                }))
               }
              >
               {formatContextualReading(readingKey)}
              </Button>
             ))}
            </div>
           ) : (
            <Typography variant="bodySmall" tone="muted">
             {t("noReading")}
            </Typography>
           )}
          </div>
         );
        })}
       </div>

       <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-2.5">
        {confirmed && onReset ? (
         <Button type="button" size="sm" variant="ghost" onClick={onReset}>
          {saveScope === "session" ? t("resetSession") : t("resetPersistent")}
         </Button>
        ) : null}
        <div className="flex gap-2">
         <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          {t("close")}
         </Button>
         {onSave ? (
          <Button
           type="button"
           size="sm"
           disabled={!canSave}
           onClick={() =>
            onSave?.({
             text: review.text,
             readings: saveReadings,
             start: review.start,
             end: review.end,
            })
           }
          >
           {saveScope === "session" ? t("applySession") : t("confirm")}
          </Button>
         ) : null}
        </div>
       </div>
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
