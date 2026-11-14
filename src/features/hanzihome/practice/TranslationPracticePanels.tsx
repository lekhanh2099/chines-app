"use client";

import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import { ContextualReaderText } from "@/features/hanzihome/components/reading/ContextualReaderText";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import {
 scoreTranslationAttempt,
 translationAttemptKey,
 type TranslationDirection,
 type TranslationPracticeState,
 type TranslationSegment,
} from "./translation-practice";
import type { TranslationEvaluationCard } from "./TranslationEvaluationCard";

function segmentButtonVariant({
 isActive,
 isChecked,
 score,
}: {
 isActive: boolean;
 isChecked: boolean;
 score: number | null;
}): "active" | "success" | "warning" | "destructive" | "outline" {
 if (isActive) return "active";
 if (!isChecked || score === null) return "outline";
 if (score === 100) return "success";
 if (score >= 70) return "warning";
 return "destructive";
}

export function TranslationSegmentNavigator({
 activeIndex,
 completedCount,
 direction,
 segment,
 segments,
 state,
 onDirectionChange,
 onMove,
}: {
 activeIndex: number;
 completedCount: number;
 direction: TranslationDirection;
 segment: TranslationSegment;
 segments: TranslationSegment[];
 state: TranslationPracticeState;
 onDirectionChange: (direction: TranslationDirection) => void;
 onMove: (index: number) => void;
}) {
 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="accent" casing="natural">
      Luyện dịch
     </Badge>
     <Typography as="h2" variant="cardTitle" weight="black">
      Luyện dịch hai chiều
     </Typography>
     <span className="hidden text-border-strong sm:inline">·</span>
     <Typography variant="caption" tone="muted" className="hidden md:inline">
      {segment.sourceLabel}
     </Typography>
    </div>

    <div className="flex items-center gap-2 self-stretch sm:self-auto">
     <SegmentedControl
      value={direction}
      items={[
       { key: "zh-vi", label: "Trung → Việt" },
       { key: "vi-zh", label: "Việt → Trung" },
      ]}
      onChange={onDirectionChange}
      aria-label="Hướng dịch"
     />
     <Badge casing="natural" className="shrink-0">
      {completedCount}/{segments.length}
     </Badge>
    </div>
   </div>

   <div
    className="flex flex-wrap items-center gap-1.5 border-t border-border-default pt-2.5"
    aria-label="Đoạn dịch"
   >
    <span className="text-xs font-semibold text-foreground-muted">
     Đoạn {segment.order}/{segments.length}:
    </span>
    {segments.map((candidate, index) => {
     const candidateKey = translationAttemptKey(candidate.id, direction);
     const isChecked = state.checked[candidateKey] === true;
     const candidateDraft = state.drafts[candidateKey] ?? "";
     const candidateScore = isChecked
      ? scoreTranslationAttempt(candidate, direction, candidateDraft)
      : null;
     const isActive = index === activeIndex;
     return (
      <Button
       key={candidate.id}
       type="button"
       size="compact"
       variant={segmentButtonVariant({
        isActive,
        isChecked,
        score: candidateScore,
       })}
       aria-current={isActive ? "step" : undefined}
       aria-label={`Chọn ${candidate.sourceLabel}, đoạn ${candidate.order}`}
       title={`${candidate.sourceLabel} · Đoạn ${candidate.order}${candidateScore !== null ? ` (${candidateScore}%)` : ""}`}
       onClick={() => onMove(index)}
      >
       {candidate.order}
      </Button>
     );
    })}
   </div>
  </Card>
 );
}

export function TranslationSourceCard({
 direction,
 effectiveDisplayMode,
 segment,
 showPinyin,
 sourceAnalysis,
 sourceText,
 onTogglePinyin,
}: {
 direction: TranslationDirection;
 effectiveDisplayMode: LessonDisplayMode;
 segment: TranslationSegment;
 showPinyin: boolean;
 sourceAnalysis: ComponentProps<typeof TranslationEvaluationCard>["referenceAnalysis"];
 sourceText: string;
 onTogglePinyin: () => void;
}) {
 return (
  <Card variant="section" padding="md" className="grid min-w-0 content-start gap-3">
   <div className="flex items-center justify-between gap-2 text-sm text-foreground-muted">
    <div className="flex items-center gap-2">
     <span>Đoạn {segment.order}</span>
     <span>·</span>
     <span>{Array.from(sourceText).length} ký tự</span>
    </div>
    {direction === "zh-vi" ? (
     <div className="flex items-center gap-1.5">
      <Button
       type="button"
       variant={showPinyin ? "active" : "outline"}
       size="compact"
       onClick={onTogglePinyin}
       aria-label={showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
      >
       Pinyin
      </Button>
      <MandarinSpeakButton text={sourceText} />
     </div>
    ) : null}
   </div>
   {direction === "zh-vi" && sourceAnalysis ? (
    <div className="min-w-0">
     <ContextualReaderText
      analysis={sourceAnalysis}
      displayMode={effectiveDisplayMode}
      showPinyin={showPinyin}
      pinyinPresentation="ruby"
      sourcePinyin={segment.pinyin}
     />
    </div>
   ) : (
    <Typography as="p" variant="body" wrapping="preWrap" leading="relaxed">
     {sourceText}
    </Typography>
   )}
   <Typography as="p" variant="caption" tone="muted">
    Bản dịch tham chiếu sẽ hiện sau khi bạn kiểm tra câu trả lời.
   </Typography>
  </Card>
 );
}

export function TranslationAnswerActions({
 activeIndex,
 checked,
 draft,
 score,
 segmentCount,
 onCheckAnswer,
 onEditAgain,
 onMove,
}: {
 activeIndex: number;
 checked: boolean;
 draft: string;
 score: Parameters<typeof segmentButtonVariant>[0]["score"];
 segmentCount: number;
 onCheckAnswer: () => void;
 onEditAgain: () => void;
 onMove: (index: number) => void;
}) {
 return (
  <div className="flex flex-wrap items-center gap-2">
   {!checked ? (
    <>
     <Button type="button" disabled={!draft.trim()} onClick={onCheckAnswer}>
      Kiểm tra
     </Button>
     {!draft.trim() ? (
      <Button type="button" variant="ghost" onClick={onCheckAnswer}>
       Xem đáp án
      </Button>
     ) : null}
    </>
   ) : score === 100 && activeIndex < segmentCount - 1 ? (
    <>
     <Button type="button" onClick={() => onMove(activeIndex + 1)}>
      Đoạn tiếp theo
     </Button>
     <Button type="button" variant="ghost" onClick={onEditAgain}>
      Sửa lại
     </Button>
    </>
   ) : (
    <>
     <Button type="button" onClick={onEditAgain}>
      Sửa lại
     </Button>
     {draft.trim() ? (
      <Button type="button" variant="outline" onClick={onCheckAnswer}>
       Kiểm tra lại
      </Button>
     ) : null}
    </>
   )}
   <Button
    type="button"
    variant="outline"
    disabled={activeIndex === 0}
    onClick={() => onMove(activeIndex - 1)}
   >
    Đoạn trước
   </Button>
   <Button
    type="button"
    variant="outline"
    disabled={activeIndex >= segmentCount - 1}
    onClick={() => onMove(activeIndex + 1)}
   >
    Đoạn sau
   </Button>
  </div>
 );
}
