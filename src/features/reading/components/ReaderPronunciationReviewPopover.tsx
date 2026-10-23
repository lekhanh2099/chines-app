"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Circle, X } from "lucide-react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/overlays/base-popover";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Label } from "@/components/ui/forms/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/forms/radio-group";
import { PinyinText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { formatContextualReading } from "@/features/hanzihome/pronunciation/contextual-pronunciation";

import type { ReaderSurfacePronunciationTarget } from "@/features/reading/model/reading-interactions";

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
      <div className="grid gap-2.5 p-3">
       <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
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
        <Button
         type="button"
         size="compact"
         variant="ghost"
         className="w-8"
         aria-label={t("close")}
         onClick={onClose}
        >
         <X aria-hidden="true" />
        </Button>
       </div>

       <Typography
        as="div"
        variant="caption"
        tone={confirmed ? "success" : "warning"}
        weight="medium"
        className="flex items-center gap-1.5"
       >
        <Circle className="size-2 fill-current" aria-hidden="true" />
        {status}
       </Typography>

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
           {review.glyphs.length > 1 ? (
            <Typography as="span" variant="cardTitle" lang="zh-CN">
             {glyph.text}
            </Typography>
           ) : null}
           {choices.length > 0 ? (
            <RadioGroup
             value={selected ?? ""}
             orientation="horizontal"
             aria-label={glyph.text}
             className="flex min-w-0 flex-wrap gap-x-3 gap-y-1.5"
             onValueChange={(readingKey) =>
              setReadingsState((current) => ({
               key: reviewKey,
               values: {
                ...(current.key === reviewKey ? current.values : initialReadings(review)),
                [String(glyph.start)]: readingKey,
               },
              }))
             }
            >
             {choices.map((readingKey) => (
              <Label
               key={readingKey}
               className="min-h-8 cursor-pointer gap-1.5 [@media(pointer:coarse)]:min-h-11"
              >
               <RadioGroupItem value={readingKey} />
               <PinyinText
                variant="bodySmall"
                tone={selected === readingKey ? "primary" : "default"}
               >
                {formatContextualReading(readingKey)}
               </PinyinText>
              </Label>
             ))}
            </RadioGroup>
           ) : (
            <Typography variant="bodySmall" tone="muted">
             {t("noReading")}
            </Typography>
           )}
          </div>
         );
        })}
       </div>

       {onSave || (confirmed && onReset) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-2.5">
         <div className="flex min-w-0 flex-wrap items-center gap-2">
          {saveScope === "session" ? (
           <Typography variant="caption" tone="muted" weight="normal">
            {t("sessionOnly")}
           </Typography>
          ) : null}
          {confirmed && onReset ? (
           <Button type="button" size="compact" variant="ghost" onClick={onReset}>
            {saveScope === "session" ? t("resetSession") : t("resetPersistent")}
           </Button>
          ) : null}
         </div>
         {onSave ? (
          <Button
           type="button"
           size="compact"
           variant="avatar"
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
           <Check aria-hidden="true" />
           {saveScope === "session" ? t("applySession") : t("confirm")}
          </Button>
         ) : null}
        </div>
       ) : null}
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
