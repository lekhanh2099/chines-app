"use client";

import { useTranslations } from "next-intl";
import { formatDictationSpeed } from "./dictation-workspace-utils";
import { useStudioDictationSession } from "./useStudioDictationSession";
import { StudioDictationDiffResult } from "./StudioDictationDiffResult";
import { StudioDictationEditorControls } from "./StudioDictationEditorControls";

import { useEffect, useRef, type KeyboardEventHandler } from "react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import {
 createListeningHotkeyHandlers,
 resolveListeningShortcut,
 runListeningShortcutAction,
 useListeningHotkeys,
} from "@/features/hanzihome/listening/useListeningHotkeys";

import type { DictationAttempt } from "@/features/dictation/dictation-session";

export function StudioDictationEditor({
 entry,
 index,
 isLoading,
 isPaused,
 isSpeaking,
 total,
 onAttempt,
 onNext,
 onPlayToggle,
 onPrevious,
 onRepeat,
 onStop,
 onToggleLoop,
}: {
 entry: ListeningTranscriptEntry;
 index: number;
 total: number;
 isLoading?: boolean;
 isPaused?: boolean;
 isSpeaking?: boolean;
 onAttempt: (attempt: DictationAttempt) => void;
 onNext: () => void;
 onPlayToggle: () => void;
 onPrevious: () => void;
 onRepeat: () => void;
 onStop?: () => void;
 onToggleLoop?: () => void;
}) {
 const t = useTranslations("Dictation");
 const {
  answer,
  attempt,
  isChecked,
  target,
  diff,
  summary,
  characterCount,
  bestScore,
  canAdvance,
  isCheckDisabled,
  updateAnswer,
  handlePrevious,
  handleNext,
  editAgain,
  confirmOrEdit,
 } = useStudioDictationSession({ entry, index, total, onAttempt, onNext, onPrevious });
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 useEffect(() => {
  if (!isChecked) textareaRef.current?.focus();
 }, [entry.id, isChecked]);

 const controlTapRef = useRef<{ downTime: number; comboUsed: boolean } | null>(null);

 useListeningHotkeys({
  enabled: true,
  onConfirm: confirmOrEdit,
  onNext: handleNext,
  onPrevious: handlePrevious,
  onPlayToggle,
  onRepeat,
  onStop,
  onToggleLoop,
 });

 const onEditorKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
  if (event.key === "Control") {
   controlTapRef.current = { downTime: event.timeStamp, comboUsed: false };
  } else if (controlTapRef.current) {
   controlTapRef.current.comboUsed = true;
  }

  if (event.defaultPrevented) return;
  if (event.nativeEvent.isComposing && !event.altKey) return;
  const action = resolveListeningShortcut(event.nativeEvent, true);
  if (action === null) return;
  const handled = runListeningShortcutAction(
   action,
   createListeningHotkeyHandlers({
    onConfirm: confirmOrEdit,
    onNext: handleNext,
    onPlayToggle,
    onPrevious: handlePrevious,
    onRepeat,
    onStop,
    onToggleLoop,
   }),
  );
  if (!handled) return;
  event.preventDefault();
  event.stopPropagation();
 };

 const onEditorKeyUp: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
  if (event.key === "Control" && controlTapRef.current) {
   const { downTime, comboUsed } = controlTapRef.current;
   controlTapRef.current = null;
   if (!comboUsed && event.timeStamp - downTime < 600) {
    onPlayToggle();
   }
  }
 };

 return (
  <div className="grid min-w-0 gap-4 border-t border-border-default pt-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="black">
      {t("partProgress", { current: index + 1, total })}
     </Typography>
     <Typography variant="caption" tone="muted">
      {t("answerSummary", {
       count: characterCount,
       score: bestScore,
      })}
     </Typography>
    </div>
    {isChecked && attempt !== undefined ? (
     <div className="flex flex-wrap items-center gap-2">
      <Badge
       variant={attempt.score === 100 ? "success" : attempt.score >= 70 ? "warning" : "danger"}
       casing="natural"
      >
       {attempt.score}%
      </Badge>
      {(() => {
       const speed = formatDictationSpeed(attempt.responseMs, characterCount);
       if (!speed) return null;
       return (
        <Badge casing="natural">
         <span aria-hidden="true">⚡</span>
         <span>{speed.durationSeconds}s</span>
         <span>·</span>
         <span>{speed.cpm} CPM</span>
        </Badge>
       );
      })()}
      <Button type="button" size="sm" variant="ghost" onClick={editAgain}>
       {t("editAgain")}
      </Button>
     </div>
    ) : null}
   </div>

   {isChecked ? (
    <StudioDictationDiffResult entry={entry} diff={diff} summary={summary} />
   ) : (
    <div className="grid gap-2">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="bodySmall" weight="black">
       {t("answerPrompt")}
      </Typography>
      <Typography variant="caption" tone="accent" weight="black">
       {t("editorShortcuts")}
      </Typography>
     </div>
     <Textarea
      ref={textareaRef}
      value={answer}
      density="comfortable"
      surface="field"
      rows={6}
      aria-label={t("answerAria", { number: index + 1 })}
      aria-keyshortcuts="1 2 3 4 5 6 Escape Control Control+Enter Meta+Enter Control+KeyR Meta+KeyR Control+ArrowLeft Meta+ArrowLeft Control+ArrowRight Meta+ArrowRight"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder={t("answerPlaceholder")}
      onKeyDown={onEditorKeyDown}
      onKeyUp={onEditorKeyUp}
      onChange={(event) => updateAnswer(event.target.value)}
     />
    </div>
   )}

   {isChecked ? (
    <div className="grid gap-3 md:grid-cols-2">
     <Card variant="subtle" padding="md" className="grid content-start gap-2">
      <Typography variant="overline" tone="accent" weight="black">
       {t("answerTitle")}
      </Typography>
      <Typography
       as="p"
       variant="body"
       weight="medium"
       leading="relaxed"
       tracking="wide"
       wrapping="preWrap"
       lang="zh-CN"
      >
       {target}
      </Typography>
      {entry.transcript.full.pinyin ? (
       <Typography variant="bodySmall" tone="accent" wrapping="preWrap">
        {entry.transcript.full.pinyin}
       </Typography>
      ) : null}
     </Card>
     <Card variant="subtle" padding="md" className="grid content-start gap-2">
      <Typography variant="overline" tone="success" weight="black">
       {t("meaning")}
      </Typography>
      <Typography variant="bodySmall" tone="muted" wrapping="preWrap">
       {entry.transcript.full.vi ?? t("noTranslation")}
      </Typography>
     </Card>
    </div>
   ) : null}

   <StudioDictationEditorControls
    index={index}
    total={total}
    isLoading={isLoading}
    isPaused={isPaused}
    isSpeaking={isSpeaking}
    isChecked={isChecked}
    canAdvance={canAdvance}
    isCheckDisabled={isCheckDisabled}
    onPlayToggle={onPlayToggle}
    onRepeat={onRepeat}
    confirmOrEdit={confirmOrEdit}
    handlePrevious={handlePrevious}
    handleNext={handleNext}
   />
  </div>
 );
}
