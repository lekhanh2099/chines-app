"use client";

import { useMemo, useRef, useState } from "react";

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
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import {
 clampTranslationIndex,
 createTranslationAttempt,
 emptyTranslationPracticeState,
 orderedTranslationSegments,
 scoreTranslationAttempt,
 translationReferenceText,
 translationSourceText,
 type TranslationDirection,
 type TranslationPracticeState,
 type TranslationSegment,
} from "./translation-practice";
import { savePracticeAttempt } from "./practice-attempt-api";

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
 const [showPinyin, setShowPinyin] = useState(displayMode.showPinyin);
 const [attemptSaveError, setAttemptSaveError] = useState("");
 const startedAtRef = useRef<Record<string, number>>({});
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

 if (!segment) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography as="p" variant="bodySmall" tone="muted" weight="semibold">
     Bài này chưa có đoạn dịch song ngữ để luyện tập.
    </Typography>
   </Card>
  );
 }

 const key = `${segment.id}:${direction}`;
 const draft = state.drafts[key] ?? "";
 const checked = state.checked[key] === true;
 const score = checked ? scoreTranslationAttempt(segment, direction, draft) : null;
 const sourceText = translationSourceText(segment, direction);
 const referenceText = translationReferenceText(segment, direction);
 const completedCount = segments.filter(
  (candidate) => state.checked[`${candidate.id}:${direction}`] === true,
 ).length;

 const updateDraft = (value: string) => {
  if (value.trim() && startedAtRef.current[key] === undefined) {
   startedAtRef.current[key] = Date.now();
  }
  setState((current) => ({
   ...current,
   drafts: { ...current.drafts, [key]: value },
   checked: { ...current.checked, [key]: false },
  }));
 };

 const checkAnswer = () => {
  const startedAt = startedAtRef.current[key];
  const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
  const attempt = createTranslationAttempt(segment, direction, draft, responseMs);
  delete startedAtRef.current[key];
  setAttemptSaveError("");
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
   checked: { ...current.checked, [key]: true },
  }));
 };

 const move = (index: number) => {
  setActiveIndex(clampTranslationIndex(index, segments.length));
  setAttemptSaveError("");
 };

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <Badge variant="accent" className="justify-self-start" casing="natural">
       Luyện dịch
      </Badge>
      <Typography as="h2" variant="sectionTitle" weight="black">
       Luyện dịch hai chiều
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Dịch theo từng đoạn, kiểm tra với đáp án tham chiếu và lưu tiến độ luyện tập.
      </Typography>
     </div>
     <Badge casing="natural">
      {completedCount}/{segments.length} đoạn
     </Badge>
    </div>

    <SegmentedControl
     value={direction}
     items={[
      { key: "zh-vi", label: "Tiếng Trung → Tiếng Việt" },
      { key: "vi-zh", label: "Tiếng Việt → Tiếng Trung" },
     ]}
     onChange={(nextDirection) => {
      setDirection(nextDirection);
      setAttemptSaveError("");
     }}
     aria-label="Hướng dịch"
    />

    <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
     <div className="grid gap-0.5">
      <Typography as="p" variant="overline" tone="muted" weight="black">
       ĐANG LÀM
      </Typography>
      <Typography as="p" variant="bodySmall" weight="black">
       {segment.sourceLabel}
      </Typography>
     </div>
     <Badge casing="natural">
      Đoạn {segment.order}/{segments.length}
     </Badge>
    </div>

    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8" aria-label="Đoạn dịch">
     {segments.map((candidate, index) => (
      <Button
       key={candidate.id}
       type="button"
       size="sm"
       variant={
        index === activeIndex
         ? "active"
         : state.checked[`${candidate.id}:${direction}`] === true
           ? "success"
           : "outline"
       }
       aria-current={index === activeIndex ? "step" : undefined}
       aria-label={`Chọn ${candidate.sourceLabel}, đoạn ${candidate.order}`}
       title={candidate.sourceLabel}
       onClick={() => move(index)}
      >
       {candidate.order}
      </Button>
     ))}
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
     <Typography as="h3" variant="cardTitle" weight="black">
      Bản dịch của bạn
     </Typography>
     <Textarea
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      placeholder={direction === "zh-vi" ? "Nhập bản dịch tiếng Việt…" : "Nhập câu tiếng Trung…"}
      aria-label="Câu trả lời dịch"
      className="min-h-36"
      autoCapitalize="off"
      autoCorrect="off"
     />
     <div className="flex flex-wrap gap-2">
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
     </div>
     {attemptSaveError ? (
      <Typography as="p" variant="caption" tone="danger">
       {attemptSaveError}
      </Typography>
     ) : null}
     {checked ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography as="p" variant="bodySmall" weight="black">
        Điểm: {score ?? 0}/100
       </Typography>
       <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0 flex-1 gap-1">
         <Typography as="p" variant="caption" tone="muted" weight="bold">
          Đáp án tham chiếu:
         </Typography>
         {direction === "vi-zh" && referenceAnalysis ? (
          <div className="min-w-0">
           <ContextualReaderText
            analysis={referenceAnalysis}
            displayMode={effectiveDisplayMode}
            showPinyin={showPinyin}
            pinyinPresentation="ruby"
            sourcePinyin={segment.pinyin}
           />
          </div>
         ) : (
          <TranslationText variant="bodySmall" tone="muted">
           {referenceText}
          </TranslationText>
         )}
        </div>
        {direction === "vi-zh" ? <MandarinSpeakButton text={referenceText} /> : null}
       </div>
      </Card>
     ) : null}
    </Card>
   </div>
  </div>
 );
}
