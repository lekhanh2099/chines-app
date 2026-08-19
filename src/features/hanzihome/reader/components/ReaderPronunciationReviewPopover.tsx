"use client";

import { useCallback, useMemo, useState } from "react";

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
) {
 if (confirmed) return saveScope === "session" ? "Đã áp dụng trong phiên" : "Đã xác nhận";
 if (review.glyphs.some((glyph) => glyph.isPolyphonic)) return "Cần kiểm tra · đa âm";
 if (review.glyphs.every((glyph) => glyph.evidence.includes("source-pinyin"))) {
  return "Theo pinyin nguồn";
 }
 return "Theo ngữ cảnh";
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
 onOpenInspector,
}: {
 target: ReaderSurfacePronunciationTarget;
 confirmed?: boolean;
 meaning?: string;
 saveScope?: ReaderPronunciationSaveScope;
 onClose: () => void;
 onSave?: (input: ReaderPronunciationSaveInput) => void;
 onReset?: () => void;
 onOpenInspector?: (text: string, rect: DOMRect) => void;
}) {
 const review = useMemo(() => resolveReviewRange(target), [target]);
 const reviewKey = `${target.segment.id}:${review.start}:${review.end}`;
 const [readingsState, setReadingsState] = useState<ReviewReadingsState>(() => ({
  key: reviewKey,
  values: initialReadings(review),
 }));
 const readings = readingsState.key === reviewKey ? readingsState.values : initialReadings(review);
 const status = reviewStatus(review, confirmed, saveScope);
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
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2 sm:flex-nowrap sm:gap-3">
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
          {status}
         </Badge>
        </div>
        <Typography variant="caption" tone="muted" leading="relaxed">
         Pinyin là đề xuất theo ngữ cảnh, không được mặc định xem là đúng. Với chữ đa âm, hãy xác
         nhận cách đọc phù hợp câu này.
        </Typography>
        {saveScope === "session" && onSave ? (
         <Typography variant="caption" tone="muted" leading="relaxed">
          Thay đổi ở nguồn này chỉ áp dụng trong phiên đọc hiện tại và không được ghi là dữ liệu đã
          xác nhận lâu dài.
         </Typography>
        ) : null}
       </div>

       {meaning ? (
        <div className="grid gap-1">
         <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
          Nghĩa trong ngữ cảnh
         </Typography>
         <Typography variant="bodySmall">{meaning}</Typography>
        </div>
       ) : null}

       <div className="grid gap-2">
        <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
         Chọn âm cho từng chữ
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
          <Card key={`${glyph.start}:${glyph.end}`} variant="subtle" padding="sm">
           <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Typography as="span" variant="sectionTitle" lang="zh-CN">
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

       <div className="grid gap-2 border-t border-border-default pt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
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
           {saveScope === "session" ? "Bỏ áp dụng" : "Bỏ xác nhận"}
          </Button>
         ) : null}
        </div>
        <div className="flex justify-end gap-2">
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
           {saveScope === "session" ? "Áp dụng trong phiên" : "Xác nhận cách đọc"}
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
