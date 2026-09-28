"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { TranslationText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { ContextualReaderText } from "@/features/hanzihome/components/reading/ContextualReaderText";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { analyzeContextualPronunciation } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { ContextualPronunciationAnalysis } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { cn } from "@/lib/utils";

import {
 clampTranslationIndex,
 createTranslationAttempt,
 emptyTranslationPracticeState,
 orderedTranslationSegments,
 scoreTranslationAttempt,
 translationReferenceText,
 translationSourceText,
 type TranslationAttempt,
 type TranslationDirection,
 type TranslationPracticeState,
 type TranslationSegment,
} from "./translation-practice";
import { savePracticeAttempt } from "./practice-attempt-api";
import {
 buildTranslationDiff,
 summarizeTranslationDiff,
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

function TranslationEvaluationCard({
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
     {direction === "vi-zh" ? <MandarinSpeakButton text={referenceText} /> : null}
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

export type LessonTranslationWorkspaceProps = {
 segments: readonly TranslationSegment[];
 displayMode?: LessonDisplayMode;
};

export function LessonTranslationWorkspace({
 segments: rawSegments,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
}: LessonTranslationWorkspaceProps) {
 const segments = useMemo(() => orderedTranslationSegments(rawSegments), [rawSegments]);
 const [activeIndex, setActiveIndex] = useState(0);
 const [direction, setDirection] = useState<TranslationDirection>("zh-vi");
 const [state, setState] = useState<TranslationPracticeState>(emptyTranslationPracticeState);
 const [attemptHistory, setAttemptHistory] = useState<Record<string, TranslationAttempt[]>>({});
 const [showPinyin, setShowPinyin] = useState(displayMode.showPinyin);
 const [attemptSaveError, setAttemptSaveError] = useState("");
 const startedAtRef = useRef<Record<string, number>>({});
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const segment = segments[activeIndex];

 const effectiveDisplayMode = useMemo<LessonDisplayMode>(
  () => ({
   ...displayMode,
   autoDetectPinyin: displayMode.autoDetectPinyin ?? true,
   showPinyin,
  }),
  [displayMode, showPinyin],
 );

 const sourceAnalysis = useMemo(() => {
  if (!segment || direction !== "zh-vi") return null;
  return analyzeContextualPronunciation({
   text: segment.zh,
   sourcePinyin: segment.pinyin.trim() ? segment.pinyin : null,
  });
 }, [direction, segment]);

 const referenceAnalysis = useMemo(() => {
  if (!segment || direction !== "vi-zh") return null;
  return analyzeContextualPronunciation({
   text: segment.zh,
   sourcePinyin: segment.pinyin.trim() ? segment.pinyin : null,
  });
 }, [direction, segment]);

 const key = segment ? `${segment.id}:${direction}` : "";
 const draft = key ? (state.drafts[key] ?? "") : "";
 const checked = key ? state.checked[key] === true : false;
 const score = checked && segment ? scoreTranslationAttempt(segment, direction, draft) : null;
 const sourceText = segment ? translationSourceText(segment, direction) : "";
 const referenceText = segment ? translationReferenceText(segment, direction) : "";
 const completedCount = segments.filter(
  (candidate) => state.checked[`${candidate.id}:${direction}`] === true,
 ).length;
 const history = key ? (attemptHistory[key] ?? []) : [];

 const updateDraft = (value: string) => {
  if (!key) return;
  if (value.trim() && startedAtRef.current[key] === undefined) {
   startedAtRef.current[key] = Date.now();
  }
  setState((current) => ({
   ...current,
   drafts: { ...current.drafts, [key]: value },
   checked: { ...current.checked, [key]: false },
  }));
 };

 const checkAnswer = useCallback(() => {
  if (!segment) return;
  const targetKey = `${segment.id}:${direction}`;
  const startedAt = startedAtRef.current[targetKey];
  const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
  const attempt = createTranslationAttempt(segment, direction, draft, responseMs);
  delete startedAtRef.current[targetKey];
  setAttemptSaveError("");
  setAttemptHistory((current) => ({
   ...current,
   [targetKey]: [...(current[targetKey] ?? []), attempt],
  }));
  void savePracticeAttempt({
   surface: "translation",
   contentId: segment.id,
   direction,
   answer: {
    answer: attempt.answer,
    reference: referenceText,
   },
   scorePercent: attempt.score,
   responseMs: attempt.responseMs,
  }).catch((error: Error) => setAttemptSaveError(error.message));
  setState((current) => ({
   ...current,
   checked: { ...current.checked, [targetKey]: true },
  }));
 }, [segment, direction, draft, referenceText]);

 const editAgain = useCallback(() => {
  if (!segment) return;
  const targetKey = `${segment.id}:${direction}`;
  setState((current) => ({
   ...current,
   checked: { ...current.checked, [targetKey]: false },
  }));
  setTimeout(() => {
   textareaRef.current?.focus();
  }, 50);
 }, [segment, direction]);

 const move = useCallback(
  (index: number) => {
   setActiveIndex(clampTranslationIndex(index, segments.length));
   setAttemptSaveError("");
  },
  [segments.length],
 );

 const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
   event.preventDefault();
   if (draft.trim()) {
    checkAnswer();
   }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "ArrowLeft") {
   event.preventDefault();
   if (activeIndex > 0) move(activeIndex - 1);
  } else if ((event.ctrlKey || event.metaKey) && event.key === "ArrowRight") {
   event.preventDefault();
   if (activeIndex < segments.length - 1) move(activeIndex + 1);
  }
 };

 const diff = useMemo(() => {
  if (!checked || !referenceText) return [];
  return buildTranslationDiff(referenceText, draft, direction);
 }, [checked, referenceText, draft, direction]);

 const summary = useMemo(() => {
  if (!checked) return null;
  return summarizeTranslationDiff(diff, direction);
 }, [checked, diff, direction]);

 if (!segment) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography as="p" variant="bodySmall" tone="muted" weight="semibold">
     Bài này chưa có đoạn dịch song ngữ để luyện tập.
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-3">
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
       onChange={(nextDirection) => {
        setDirection(nextDirection);
        setAttemptSaveError("");
       }}
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
      const isChecked = state.checked[`${candidate.id}:${direction}`] === true;
      const isActive = index === activeIndex;
      return (
       <Button
        key={candidate.id}
        type="button"
        size="compact"
        variant={isActive ? "active" : isChecked ? "success" : "outline"}
        aria-current={isActive ? "step" : undefined}
        aria-label={`Chọn ${candidate.sourceLabel}, đoạn ${candidate.order}`}
        title={`${candidate.sourceLabel} · Đoạn ${candidate.order}`}
        onClick={() => move(index)}
       >
        {candidate.order}
       </Button>
      );
     })}
    </div>
   </Card>

   <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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
         onClick={() => setShowPinyin((prev) => !prev)}
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

    <Card variant="subtle" padding="md" className="grid min-w-0 content-start gap-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography as="h3" variant="cardTitle" weight="black">
       Bản dịch của bạn
      </Typography>
      <Typography variant="caption" tone="muted">
       Ctrl/⌘ ↵ kiểm tra · Ctrl/⌘ ←/→ chuyển đoạn
      </Typography>
     </div>
     <Textarea
      ref={textareaRef}
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      onKeyDown={handleEditorKeyDown}
      placeholder={direction === "zh-vi" ? "Nhập bản dịch tiếng Việt…" : "Nhập câu tiếng Trung…"}
      aria-label="Câu trả lời dịch"
      className="min-h-36"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
     />
     <div className="flex flex-wrap items-center gap-2">
      <Button type="button" disabled={!draft.trim()} onClick={checkAnswer}>
       Kiểm tra
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex === 0}
       onClick={() => move(activeIndex - 1)}
      >
       Đoạn trước
      </Button>
      <Button
       type="button"
       variant="outline"
       disabled={activeIndex >= segments.length - 1}
       onClick={() => move(activeIndex + 1)}
      >
       Đoạn sau
      </Button>
      {checked && score !== null ? (
       <Button type="button" variant="ghost" size="sm" onClick={editAgain}>
        Sửa lại
       </Button>
      ) : null}
     </div>
     {attemptSaveError ? (
      <Typography as="p" variant="caption" tone="danger">
       {attemptSaveError}
      </Typography>
     ) : null}
     {checked && score !== null && summary !== null ? (
      <TranslationEvaluationCard
       score={score}
       history={history}
       diff={diff}
       summary={summary}
       direction={direction}
       referenceText={referenceText}
       referenceAnalysis={referenceAnalysis}
       effectiveDisplayMode={effectiveDisplayMode}
       showPinyin={showPinyin}
       sourcePinyin={segment.pinyin}
       onEditAgain={editAgain}
       onNextSegment={() => move(activeIndex + 1)}
       hasNext={activeIndex < segments.length - 1}
      />
     ) : null}
    </Card>
   </div>
  </div>
 );
}
