"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

type ReviewRange = {
 text: string;
 start: number;
 end: number;
 glyphs: ReaderSurfacePronunciationTarget["analysis"]["glyphs"];
};

function resolveReviewRange(target: ReaderSurfacePronunciationTarget): ReviewRange {
 const token = target.analysis.tokens.find(
  (item) =>
   item.type === "hanzi" &&
   item.start <= target.glyph.start &&
   item.end >= target.glyph.end,
 );
 const start = token?.start ?? target.glyph.start;
 const end = token?.end ?? target.glyph.end;
 const glyphs = target.analysis.glyphs.filter(
  (glyph) => glyph.start >= start && glyph.end <= end,
 );
 return {
  text: target.segment.zh.slice(start, end) || target.glyph.text,
  start,
  end,
  glyphs: glyphs.length > 0 ? glyphs : [target.glyph],
 };
}

function confidencePercent(review: ReviewRange, confirmed: boolean) {
 if (confirmed) return 100;
 const lowest = Math.min(...review.glyphs.map((glyph) => glyph.confidence));
 return Math.max(0, Math.min(100, Math.round(lowest * 100)));
}

function initialReadings(review: ReviewRange) {
 return Object.fromEntries(
  review.glyphs.flatMap((glyph) => {
   const reading = glyph.lexicalReadingKey ?? glyph.spokenReadingKey;
   return reading ? [[String(glyph.start), reading]] : [];
  }),
 );
}

export function ReaderPronunciationReviewPopover({
 target,
 confirmed = false,
 meaning,
 onClose,
 onSave,
 onReset,
 onOpenInspector,
}: {
 target: ReaderSurfacePronunciationTarget;
 confirmed?: boolean;
 meaning?: string;
 onClose: () => void;
 onSave?: (input: ReaderPronunciationSaveInput) => void;
 onReset?: () => void;
 onOpenInspector?: (text: string, rect: DOMRect) => void;
}) {
 const review = useMemo(() => resolveReviewRange(target), [target]);
 const [readings, setReadings] = useState<Record<string, string>>(() => initialReadings(review));
 useEffect(() => setReadings(initialReadings(review)), [review]);
 const confidence = confidencePercent(review, confirmed);
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
     <BasePopoverPopup
      variant="lookupWide"
      data-no-inspector
      initialFocus={false}
      finalFocus={false}
     >
      <div className="grid gap-4 p-4">
       <div className="grid gap-1">
        <div className="flex min-w-0 items-start justify-between gap-3">
         <div className="grid min-w-0 gap-0.5">
          <Typography as="strong" variant="sectionTitle" lang="zh-CN" clamp="one">
           {review.text}
          </Typography>
          <PinyinText variant="bodySmall" tone="muted">
           {review.glyphs
            .map((glyph) => glyph.lexicalPinyin ?? glyph.spokenPinyin)
            .filter((value): value is string => Boolean(value))
            .join(" ") || "Chưa xác định pinyin"}
          </PinyinText>
         </div>
         <Badge variant={confirmed ? "success" : "warning"} casing="natural">
          {confirmed ? "Đã xác nhận" : `Độ chắc chắn ${confidence}%`}
         </Badge>
        </div>
        <Typography variant="caption" tone="muted" leading="relaxed">
         Pinyin là đề xuất theo ngữ cảnh, không được mặc định xem là đúng. Với chữ đa âm, hãy xác nhận cách đọc phù hợp câu này.
        </Typography>
       </div>

       <div className="grid gap-1">
        <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
         Nghĩa trong ngữ cảnh
        </Typography>
        <Typography variant="bodySmall">
         {meaning || "Chưa có nghĩa tiếng Việt đã xác định cho cụm này."}
        </Typography>
       </div>

       <div className="grid gap-2">
        <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
         Chọn âm cho từng chữ
        </Typography>
        {review.glyphs.map((glyph) => {
         const choices = [
          ...new Set(
           [glyph.lexicalReadingKey, ...glyph.alternatives].filter(
            (value): value is string => Boolean(value),
           ),
          ),
         ];
         const selected = readings[String(glyph.start)];
         return (
          <Card key={`${glyph.start}:${glyph.end}`} variant="subtle" padding="sm">
           <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Typography as="span" variant="sectionTitle" lang="zh-CN" className="mr-1">
             {glyph.text}
            </Typography>
            {choices.length > 0 ? (
             choices.map((readingKey) => (
              <Button
               key={readingKey}
               type="button"
               size="sm"
               variant={selected === readingKey ? "active" : "outline"}
               aria-pressed={selected === readingKey}
               onClick={() =>
                setReadings((current) => ({
                 ...current,
                 [String(glyph.start)]: readingKey,
                }))
               }
              >
               {formatContextualReading(readingKey)}
              </Button>
             ))
            ) : (
             <Typography variant="bodySmall" tone="muted">
              Chưa có cách đọc khả dụng.
             </Typography>
            )}
           </div>
          </Card>
         );
        })}
       </div>

       <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-3">
        <div className="flex flex-wrap gap-2">
         {onOpenInspector ? (
          <Button
           type="button"
           size="sm"
           variant="ghost"
           onClick={() => onOpenInspector(review.text, target.rect)}
          >
           Mở phân tích đầy đủ
          </Button>
         ) : null}
         {confirmed && onReset ? (
          <Button type="button" size="sm" variant="ghost" onClick={onReset}>
           Bỏ xác nhận
          </Button>
         ) : null}
        </div>
        <div className="flex gap-2">
         <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Đóng
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
           Xác nhận cách đọc
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
