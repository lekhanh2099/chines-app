"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import { TranslationText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 scoreTranslationAttempt,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";
import { evaluateHumanitiesAnswer } from "@/features/humanities/humanities-evaluator";
import {
 humanitiesPracticeContent,
 type HumanitiesPracticeTrack,
} from "@/features/humanities/humanities-practice-content";

import {
 createTranslationRevisionSubmission,
 type createTranslationSubmission,
} from "./translation-workspace-utils";
import type { useTranslationAttempts } from "./useTranslationAttempts";

export function TranslationAnswerPanel({
 activeTrack,
 segment,
 direction,
 humanitiesEvaluation,
 interpretingPanel,
 draft,
 backTranslation,
 isChecked,
 saveError,
 activeIndex,
 segmentCount,
 replayCount,
 submitAttempt,
 onDraftChange,
 onCheck,
 onPreviousSegment,
 onNextSegment,
 onPlaySource,
 onBackTranslationChange,
}: {
 activeTrack: HumanitiesPracticeTrack;
 segment: Parameters<typeof createTranslationSubmission>[0];
 direction: TranslationDirection;
 humanitiesEvaluation: Parameters<typeof createTranslationSubmission>[4];
 interpretingPanel: ReactNode;
 draft: string;
 backTranslation: string;
 isChecked: boolean;
 saveError: ReturnType<typeof useTranslationAttempts>["saveError"];
 activeIndex: number;
 segmentCount: number;
 replayCount: number;
 submitAttempt: ReturnType<typeof useTranslationAttempts>["submitAttempt"];
 onDraftChange: (value: string) => void;
 onCheck: () => void;
 onPreviousSegment: () => void;
 onNextSegment: () => void;
 onPlaySource: () => void;
 onBackTranslationChange: (value: string) => void;
}) {
 const t = useTranslations("HumanitiesPractice");
 const content = humanitiesPracticeContent[activeTrack];
 const humanitiesResult = useMemo(
  () =>
   isChecked && humanitiesEvaluation !== undefined
    ? evaluateHumanitiesAnswer(draft, humanitiesEvaluation)
    : null,
  [isChecked, draft, humanitiesEvaluation],
 );
 const score =
  segment && isChecked
   ? (humanitiesResult?.score ?? scoreTranslationAttempt(segment, direction, draft))
   : null;

 return (
  <Card variant="subtle" padding="md" className="grid min-w-0 content-start gap-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="grid gap-0.5">
     <Typography as="strong" variant="bodySmall" weight="black">
      {t("answer.title")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted">
      {t("answer.unsaved")}
     </Typography>
    </div>
    <Button
     type="button"
     variant="outline"
     disabled={!draft.trim()}
     onClick={() => {
      if (!segment || !draft.trim()) return;
      submitAttempt(
       createTranslationRevisionSubmission({ contentId: segment.id, direction }, draft),
      );
     }}
    >
     {t("answer.saveRevision")}
    </Button>
   </div>
   <Typography as="p" variant="caption" tone="muted">
    {content.sourceReminder}
   </Typography>
   {interpretingPanel}
   <Textarea
    value={draft}
    onChange={(event) => onDraftChange(event.target.value)}
    placeholder={t("answer.translationPlaceholder")}
    aria-label={t("answer.translationAria")}
    className="min-h-32"
   />
   <div className="flex flex-wrap gap-2">
    <Button type="button" disabled={!draft.trim()} onClick={onCheck}>
     {t("answer.check")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={activeIndex === 0}
     onClick={onPreviousSegment}
    >
     {t("answer.previousSegment")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={activeIndex >= segmentCount - 1}
     onClick={onNextSegment}
    >
     {t("answer.nextSegment")}
    </Button>
    <Button
     type="button"
     variant="outline"
     disabled={
      humanitiesEvaluation?.mode === "interpreting" &&
      humanitiesEvaluation.replayLimit !== null &&
      replayCount >= humanitiesEvaluation.replayLimit
     }
     onClick={onPlaySource}
    >
     {t("answer.playSource")}
     {humanitiesEvaluation?.mode === "interpreting" && humanitiesEvaluation.replayLimit !== null
      ? ` (${replayCount}/${humanitiesEvaluation.replayLimit})`
      : ""}
    </Button>
   </div>
   {saveError ? (
    <Typography as="p" variant="caption" tone="danger">
     {saveError}
    </Typography>
   ) : null}
   <Typography as="p" variant="caption" tone="muted">
    {t("answer.evaluationNotice")}
   </Typography>
   {activeTrack === "translation" ? (
    <Card variant="subtle" padding="sm" className="grid gap-2">
     <Typography as="strong" variant="bodySmall" weight="black">
      {t("answer.backTranslationTitle")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted">
      {t("answer.backTranslationDescription")}
     </Typography>
     <Textarea
      value={backTranslation}
      onChange={(event) => onBackTranslationChange(event.target.value)}
      placeholder={t("answer.backTranslationPlaceholder")}
      aria-label={t("answer.backTranslationAria")}
      rows={3}
     />
    </Card>
   ) : null}
   {isChecked ? (
    <Card variant="subtle" padding="sm" className="grid gap-2">
     <Typography as="p" variant="bodySmall" weight="black">
      {t("answer.score", { score: score ?? 0 })}
     </Typography>
     <TranslationText variant="bodySmall" tone="muted">
      {t("answer.reference")}{" "}
      {humanitiesEvaluation?.references[0]?.text ??
       (direction === "zh-vi" ? segment.vi : segment.zh)}
     </TranslationText>
     {humanitiesResult ? (
      <div className="grid gap-1">
       {humanitiesResult.unitResults.map((unit) => (
        <Typography
         key={unit.unitId}
         as="p"
         variant="caption"
         tone={
          unit.status === "covered" ? "success" : unit.status === "missing" ? "danger" : "muted"
         }
        >
         {unit.status === "covered" ? "✓" : "•"} {unit.messageVi}
        </Typography>
       ))}
      </div>
     ) : null}
    </Card>
   ) : null}
  </Card>
 );
}
