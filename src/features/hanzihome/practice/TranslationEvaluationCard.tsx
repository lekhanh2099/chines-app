"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { TranslationText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { ContextualReaderText } from "@/features/hanzihome/components/reading/ContextualReaderText";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import type { ContextualPronunciationAnalysis } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { cn } from "@/lib/utils";

import type { TranslationAttempt, TranslationDirection } from "./translation-practice";
import {
 translationScoreBadgeVariant,
 translationScoreLabel,
 type TranslationDiffKind,
 type TranslationDiffSummary,
 type TranslationDiffToken,
} from "./translation-comparison";

function tokenTone(kind: TranslationDiffKind): "success" | "warning" | "danger" {
 if (kind === "match") return "success";
 if (kind === "missing") return "warning";
 return "danger";
}

type TranslationDiffTokensProps = {
 diff: TranslationDiffToken[];
 direction: TranslationDirection;
};

function TranslationDiffTokens({ diff, direction }: TranslationDiffTokensProps) {
 if (diff.length === 0) return null;

 if (direction === "vi-zh") {
  return (
   <Typography
    as="div"
    variant="body"
    weight="medium"
    leading="relaxed"
    tracking="wide"
    wrapping="breakWords"
    lang="zh-CN"
    className="flex flex-wrap items-baseline gap-x-0.5"
   >
    {diff.map((token, tokenIndex) => {
     const tone = tokenTone(token.kind);
     return (
      <span
       key={`zh-token-${tokenIndex}-${token.kind}-${token.value}`}
       className={cn(
        tone === "success" && "text-success-text",
        tone === "warning" && "text-warning-text line-through opacity-75",
        tone === "danger" && "text-danger-text underline decoration-danger/40",
       )}
       title={
        token.expected && token.actual && token.expected !== token.actual
         ? `Đúng: ${token.expected}`
         : undefined
       }
      >
       {token.kind === "missing" ? `(${token.expected})` : token.value}
      </span>
     );
    })}
   </Typography>
  );
 }

 return (
  <Typography
   as="div"
   variant="body"
   weight="medium"
   leading="relaxed"
   tracking="normal"
   wrapping="breakWords"
   className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1"
  >
   {diff.map((token, tokenIndex) => {
    const tone = tokenTone(token.kind);
    return (
     <span
      key={`vi-token-${tokenIndex}-${token.kind}-${token.value}`}
      className={cn(
       tone === "success" && "text-success-text",
       tone === "warning" && "text-warning-text line-through opacity-75",
       tone === "danger" && "text-danger-text underline decoration-danger/40",
      )}
      title={
       token.expected && token.actual && token.expected !== token.actual
        ? `Đúng: ${token.expected}`
        : undefined
      }
     >
      {token.kind === "missing" ? `(${token.expected})` : token.value}
     </span>
    );
   })}
  </Typography>
 );
}

type TranslationSummaryBadgesProps = {
 summary: TranslationDiffSummary;
};

function TranslationSummaryBadges({ summary }: TranslationSummaryBadgesProps) {
 return (
  <div className="flex flex-wrap gap-2 pt-1">
   <Badge variant="success" casing="natural">
    Đúng {summary.correct}
   </Badge>
   {summary.replaced > 0 ? (
    <Badge variant="danger" casing="natural">
     Thay {summary.replaced}
    </Badge>
   ) : null}
   {summary.missing > 0 ? (
    <Badge variant="warning" casing="natural">
     Thiếu {summary.missing}
    </Badge>
   ) : null}
   {summary.extra > 0 ? (
    <Badge variant="danger" casing="natural">
     Thừa {summary.extra}
    </Badge>
   ) : null}
   {summary.transposed > 0 ? (
    <Badge variant="warning" casing="natural">
     Đảo {summary.transposed}
    </Badge>
   ) : null}
  </div>
 );
}

type TranslationEvaluationCardProps = {
 score: number;
 history: TranslationAttempt[];
 diff: TranslationDiffToken[];
 summary: TranslationDiffSummary;
 direction: TranslationDirection;
 referenceText: string;
 referenceAnalysis: ContextualPronunciationAnalysis | null;
 effectiveDisplayMode: LessonDisplayMode;
 showPinyin: boolean;
 sourcePinyin: string;
 onEditAgain: () => void;
 onNextSegment?: () => void;
 hasNext: boolean;
};

export function TranslationEvaluationCard({
 score,
 history,
 diff,
 summary,
 direction,
 referenceText,
 referenceAnalysis,
 effectiveDisplayMode,
 showPinyin,
 sourcePinyin,
 onEditAgain,
 onNextSegment,
 hasNext,
}: TranslationEvaluationCardProps) {
 const badgeVariant = translationScoreBadgeVariant(score);
 const badgeLabel = translationScoreLabel(score);

 const [copiedText, setCopiedText] = useState<string | null>(null);
 const copied = copiedText === referenceText;

 const handleCopy = () => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
   void navigator.clipboard.writeText(referenceText);
   setCopiedText(referenceText);
   setTimeout(() => setCopiedText(null), 2000);
  }
 };

 return (
  <Card variant="subtle" padding="md" className="grid gap-3.5">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2.5">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant={badgeVariant} casing="natural">
      {badgeLabel}
     </Badge>
     <Typography as="span" variant="caption" tone="muted">
      Lần thử {history.length}
     </Typography>
     {history.length > 1 ? (
      <Typography as="span" variant="caption" tone="muted">
       Điểm: {history.map((item) => `${item.score}%`).join(" → ")}
      </Typography>
     ) : null}
    </div>
    <Button type="button" size="sm" variant="ghost" onClick={onEditAgain}>
     Sửa lại
    </Button>
   </div>

   <div className="grid gap-2 rounded-control border border-border bg-surface-muted/50 p-3">
    <Typography as="p" variant="caption" tone="muted" weight="bold">
     So sánh câu trả lời
    </Typography>
    <TranslationDiffTokens diff={diff} direction={direction} />
    <TranslationSummaryBadges summary={summary} />
   </div>

   <div className="grid gap-2">
    <div className="flex items-center justify-between gap-2">
     <Typography as="p" variant="caption" tone="muted" weight="bold">
      Đáp án tham chiếu:
     </Typography>
     <div className="flex items-center gap-1.5">
      <Button
       type="button"
       variant="ghost"
       size="compact"
       onClick={handleCopy}
       aria-label={copied ? "Đã sao chép đáp án" : "Sao chép đáp án"}
       title={copied ? "Đã sao chép" : "Sao chép đáp án"}
      >
       {copied ? <Check /> : <Copy />}
       <span>{copied ? "Đã chép" : "Sao chép"}</span>
      </Button>
      {direction === "vi-zh" ? <MandarinSpeakButton text={referenceText} /> : null}
     </div>
    </div>
    {direction === "vi-zh" && referenceAnalysis ? (
     <div className="min-w-0">
      <ContextualReaderText
       analysis={referenceAnalysis}
       displayMode={effectiveDisplayMode}
       showPinyin={showPinyin}
       pinyinPresentation="ruby"
       sourcePinyin={sourcePinyin}
      />
     </div>
    ) : (
     <TranslationText variant="bodySmall" tone="muted" leading="relaxed">
      {referenceText}
     </TranslationText>
    )}
   </div>

   {score === 100 && hasNext && onNextSegment ? (
    <div className="flex items-center justify-between gap-3 border-t border-border-default pt-2.5">
     <Typography variant="caption" tone="success" weight="bold">
      🎉 Tuyệt vời! Bạn đã dịch chính xác 100%.
     </Typography>
     <Button type="button" size="sm" variant="default" onClick={onNextSegment}>
      Đoạn tiếp theo
     </Button>
    </div>
   ) : null}
  </Card>
 );
}
