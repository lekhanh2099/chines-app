"use client";

import { Eye, EyeOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Input } from "@/components/ui/forms/input";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { formatDictationSpeed } from "@/features/dictation/dictation-workspace-utils";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { cn } from "@/lib/utils";
import type { AmbientPipDictationSession } from "./useAmbientPipDictationSession";

/** Active word: audio and hint controls, then either the answer input or the checked result. */
export function AmbientPipDictationPractice({ session }: { session: AmbientPipDictationSession }) {
 const {
  dictationMode,
  currentItem,
  currentIndex,
  answer,
  isChecked,
  attempt,
  showHint,
  inputRef,
  playCurrentAudio,
  playSecondaryAudio,
  handleToggleHint,
  handleAnswerChange,
  handleCheck,
  handleNext,
  handleEditAgain,
 } = session;

 const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.nativeEvent.isComposing) return;
  if (event.key === "Enter") {
   event.preventDefault();
   if (isChecked) {
    handleNext();
   } else {
    handleCheck();
   }
   return;
  }
  if (event.key === "Escape" && isChecked) {
   event.preventDefault();
   handleEditAgain();
   return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
   event.preventDefault();
   playCurrentAudio();
  }
 };

 return (
  <div className="grid gap-2.5">
   {/* Audio Play Trigger & Hint Area */}
   <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-1.5">
     <Button
      type="button"
      variant="outline"
      size="compact"
      onClick={playCurrentAudio}
      title={
       dictationMode === "vi-to-zh"
        ? "Nghe nghĩa tiếng Việt (Ctrl+R)"
        : "Nghe phát âm tiếng Trung (Ctrl+R)"
      }
     >
      <Volume2 className={cn("size-3.5", dictationMode === "vi-to-zh" && "text-primary")} />
      <span>{dictationMode === "vi-to-zh" ? "Nghe tiếng Việt (Ctrl+R)" : "Nghe lại (Ctrl+R)"}</span>
     </Button>

     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={playSecondaryAudio}
      title={
       dictationMode === "vi-to-zh" ? "Nghe thêm phát âm tiếng Trung" : "Nghe thêm nghĩa tiếng Việt"
      }
      aria-label={
       dictationMode === "vi-to-zh" ? "Nghe thêm phát âm tiếng Trung" : "Nghe thêm nghĩa tiếng Việt"
      }
     >
      <span className="text-xs font-semibold">
       {dictationMode === "vi-to-zh" ? "🇨🇳 Trung" : "🇻🇳 Việt"}
      </span>
     </Button>
    </div>

    <Button
     type="button"
     variant="ghost"
     size="compact"
     onClick={handleToggleHint}
     aria-label={showHint ? "Ẩn gợi ý nghĩa" : "Hiện gợi ý nghĩa"}
    >
     {showHint ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
     <span>{showHint ? "Ẩn gợi ý" : "Gợi ý"}</span>
    </Button>
   </div>

   {/* Hint Display (if toggled or if checked) */}
   {showHint && !isChecked ? (
    <div className="rounded-lg border border-border-default/50 bg-bg-subtle p-2 text-center">
     <div className="flex flex-wrap items-center justify-center gap-2">
      <StudyInstructionText tone="accent" weight="bold">
       {currentItem.pinyin}
      </StudyInstructionText>
      {currentItem.meaning.hanviet ? (
       <>
        <StudyInstructionText tone="muted">·</StudyInstructionText>
        <StudyInstructionText tone="secondary" weight="semibold">
         {`[${currentItem.meaning.hanviet}]`}
        </StudyInstructionText>
       </>
      ) : null}
      <StudyInstructionText tone="muted">·</StudyInstructionText>
      <StudyInstructionText tone="secondary" weight="semibold">
       {getVocabDisplayMeaning(currentItem)}
      </StudyInstructionText>
     </div>
    </div>
   ) : null}

   {/* Checked Result Diff & Speed */}
   {isChecked && attempt !== null ? (
    <AmbientPipDictationResult session={session} />
   ) : (
    /* Input Field */
    <div className="grid gap-1.5">
     <Input
      ref={inputRef}
      type="text"
      value={answer}
      density="compact"
      surface="field"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder={
       dictationMode === "vi-to-zh"
        ? "Nghe nghĩa tiếng Việt, gõ chữ Hán..."
        : "Gõ chữ Hán rồi bấm Enter..."
      }
      aria-label={`Gõ chữ Hán cho từ số ${currentIndex + 1}`}
      onChange={(e) => handleAnswerChange(e.target.value)}
      onKeyDown={handleKeyDown}
     />
     <StudyInstructionText variant="caption" tone="muted" className="text-center">
      {dictationMode === "vi-to-zh"
       ? "Bấm Enter để kiểm tra · Ctrl+R nghe tiếng Việt"
       : "Bấm Enter để kiểm tra · Ctrl+R để nghe lại"}
     </StudyInstructionText>
    </div>
   )}
  </div>
 );
}

/** Checked attempt: hero Hanzi or character diff, score / speed badges and the correct answer. */
function AmbientPipDictationResult({ session }: { session: AmbientPipDictationSession }) {
 const { attempt, currentItem } = session;
 if (attempt === null) return null;
 const speed = formatDictationSpeed(attempt.responseMs, currentItem.hanzi.length);
 return (
  <div className="grid gap-2 rounded-xl border border-border-default/60 bg-bg-subtle p-3 text-center">
   {/* Large Hero Hanzi for recognition / visual imprint */}
   <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
    {attempt.score === 100 ? (
     <HanziText as="h2" size="review" weight="black" tone="success" leading="none">
      {currentItem.hanzi}
     </HanziText>
    ) : (
     attempt.diff.map((token, idx) => (
      <span
       key={`${idx}-${token.kind}-${token.value}`}
       className={cn(
        "font-hanzi text-3xl font-black",
        token.kind === "match" && "text-success-text",
        token.kind === "missing" && "line-through opacity-75 text-warning-text",
        (token.kind === "extra" || token.kind === "replace" || token.kind === "transpose") &&
         "text-danger-text",
       )}
      >
       {token.kind === "missing" ? `(${token.expected})` : token.value}
      </span>
     ))
    )}
   </div>

   {/* Score and Speed Badges */}
   <div className="flex items-center justify-center gap-2">
    <Badge
     variant={attempt.score === 100 ? "success" : attempt.score >= 70 ? "warning" : "danger"}
     casing="natural"
    >
     {attempt.score}%
    </Badge>
    {speed ? (
     <Badge casing="natural">
      <span aria-hidden="true">⚡</span>
      <span>{speed.durationSeconds}s</span>
      <span>·</span>
      <span>{speed.cpm} CPM</span>
     </Badge>
    ) : null}
   </div>

   {/* Correct Pinyin & Meaning */}
   <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
    {attempt.score < 100 ? (
     <HanziText as="span" size="large" weight="black" tone="accent">
      {currentItem.hanzi}
     </HanziText>
    ) : null}
    <StudyInstructionText tone="accent" weight="bold">
     {currentItem.pinyin}
    </StudyInstructionText>
    {currentItem.meaning.hanviet ? (
     <>
      <StudyInstructionText tone="muted">·</StudyInstructionText>
      <StudyInstructionText tone="secondary" weight="bold">
       {`[${currentItem.meaning.hanviet}]`}
      </StudyInstructionText>
     </>
    ) : null}
    <StudyInstructionText tone="muted">·</StudyInstructionText>
    <StudyInstructionText tone="secondary" weight="semibold">
     {getVocabDisplayMeaning(currentItem)}
    </StudyInstructionText>
   </div>
  </div>
 );
}
