"use client";

import { useTranslations } from "next-intl";
import { useStudioDictationSession } from "./useStudioDictationSession";

import { useEffect, useRef, type KeyboardEventHandler } from "react";
import { Pause, Play, Repeat2 } from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import { cn } from "@/lib/utils";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import {
 createListeningHotkeyHandlers,
 resolveListeningShortcut,
 runListeningShortcutAction,
 useListeningHotkeys,
} from "@/features/hanzihome/listening/useListeningHotkeys";

import type { buildDictationDiff } from "@/features/hanzihome/practice/dictation-comparison";
import type { DictationAttempt } from "@/features/dictation/dictation-session";

type DictationTokenTone = "success" | "warning" | "danger";

function tokenTone(
 kind: ReturnType<typeof buildDictationDiff>[number]["kind"],
): DictationTokenTone {
 if (kind === "match") return "success";
 if (kind === "missing") return "warning";
 return "danger";
}

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
     <div className="flex items-center gap-2">
      <Badge
       variant={attempt.score === 100 ? "success" : attempt.score >= 70 ? "warning" : "danger"}
       casing="natural"
      >
       {attempt.score}%
      </Badge>
      <Button type="button" size="sm" variant="ghost" onClick={editAgain}>
       {t("editAgain")}
      </Button>
     </div>
    ) : null}
   </div>

   {isChecked ? (
    <Card variant="subtle" padding="md" className="grid gap-3">
     <Typography
      as="div"
      variant="sectionTitle"
      weight="medium"
      leading="relaxed"
      tracking="wide"
      wrapping="breakWords"
      lang="zh-CN"
     >
      {diff.map((token, tokenIndex) => (
       <span
        key={`${entry.id}:${tokenIndex}:${token.kind}:${token.value}`}
        className={cn(
         tokenTone(token.kind) === "success" && "text-success-text",
         tokenTone(token.kind) === "warning" && "text-warning-text",
         tokenTone(token.kind) === "danger" && "text-danger-text",
         token.kind === "missing" && "line-through opacity-75",
        )}
        title={
         token.expected && token.actual && token.expected !== token.actual
          ? t("expected", { value: token.expected })
          : undefined
        }
       >
        {token.kind === "missing" ? `(${token.expected})` : token.value}
       </span>
      ))}
     </Typography>
     {summary ? (
      <div className="flex flex-wrap gap-2">
       <Badge variant="success" casing="natural">
        {t("correct", { count: summary.correct })}
       </Badge>
       {summary.replaced > 0 ? (
        <Badge variant="danger" casing="natural">
         {t("replaced", { count: summary.replaced })}
        </Badge>
       ) : null}
       {summary.missing > 0 ? (
        <Badge variant="warning" casing="natural">
         {t("missing", { count: summary.missing })}
        </Badge>
       ) : null}
       {summary.extra > 0 ? (
        <Badge variant="danger" casing="natural">
         {t("extra", { count: summary.extra })}
        </Badge>
       ) : null}
       {summary.transposed > 0 ? (
        <Badge variant="warning" casing="natural">
         {t("transposed", { count: summary.transposed })}
        </Badge>
       ) : null}
      </div>
     ) : null}
    </Card>
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

   <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border-default pt-4 sm:flex-row sm:items-center">
    <div className="flex flex-wrap items-center gap-2">
     {onPlayToggle ? (
      <Button type="button" variant="outline" disabled={isLoading} onClick={onPlayToggle}>
       {isSpeaking && !isPaused ? (
        <Pause data-icon="inline-start" />
       ) : (
        <Play data-icon="inline-start" />
       )}
       {isLoading
        ? t("preparing")
        : isSpeaking && !isPaused
          ? t("pause")
          : isPaused
            ? t("resume")
            : t("listenPart")}
       <Badge size="sm" casing="natural">
        {isChecked ? "2 · Control" : "Control"}
       </Badge>
      </Button>
     ) : null}
     {onRepeat ? (
      <Button type="button" variant="ghost" onClick={onRepeat}>
       <Repeat2 data-icon="inline-start" />
       {t("replay")}
       <Badge size="sm" casing="natural">
        {isChecked ? "3 · Ctrl/⌘ R" : "Ctrl/⌘ R"}
       </Badge>
      </Button>
     ) : null}
     <Button type="button" disabled={isCheckDisabled} onClick={confirmOrEdit}>
      {isChecked ? (canAdvance ? t("nextPart") : t("editAgain")) : t("check")}
      <Badge size="sm" casing="natural">
       {isChecked ? "6 · Ctrl/⌘ ↵" : "Ctrl/⌘ ↵"}
      </Badge>
     </Button>
    </div>
    {total > 1 ? (
     <div className="flex flex-wrap gap-2 sm:ms-auto">
      <Button type="button" variant="ghost" disabled={index === 0} onClick={handlePrevious}>
       {t("previousArrow")}
       <Badge size="sm" casing="natural">
        {isChecked ? "1 · Ctrl/⌘ ←" : "Ctrl/⌘ ←"}
       </Badge>
      </Button>
      <Button type="button" variant="ghost" disabled={index >= total - 1} onClick={handleNext}>
       {t("nextArrow")}
       <Badge size="sm" casing="natural">
        {isChecked ? "4 · Ctrl/⌘ →" : "Ctrl/⌘ →"}
       </Badge>
      </Button>
     </div>
    ) : null}
   </div>
  </div>
 );
}
