"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import {
 StudyInstructionText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import { ListeningTranscriptBlock } from "./ListeningTranscriptBlock";
import {
 ExerciseAudioButton,
 ItemHeader,
 StressText,
 type ListeningExerciseItemsProps,
} from "./ListeningExerciseItemParts";
import { isListeningChoiceCorrect } from "./listening-exercise-utils";

export function ChoiceItems({
 items,
 exerciseType,
 selections,
 checked,
 onSelect,
 onCheck,
 showPinyin,
 showMeaning,
 showScript,
 hideScriptBeforeCheck,
 showTranslationAfterCheck,
 sharedTranscript,
 displayMode,
 onSpeak,
 onSpeakSequence,
 revealedScripts,
 onToggleScript,
}: ListeningExerciseItemsProps & {
 selections: Record<string, string>;
 checked: Record<string, boolean>;
 onSelect: (itemId: string, value: string) => void;
 onCheck: (itemId: string) => void;
 revealedScripts: Record<string, boolean>;
 onToggleScript: (itemId: string) => void;
}) {
 const t = useTranslations("Listening");
 return items.map((item, index) => {
  const selected = selections[item.id];
  const correct = item.answer?.type === "choice" ? item.answer.value : undefined;
  const isChecked = checked[item.id] ?? false;
  const isCorrect = isChecked && isListeningChoiceCorrect(item, selected ?? "");
  const transcriptText = item.transcript?.full.zh ?? sharedTranscript?.full.zh;
  const hasPlayableText = Boolean(transcriptText?.trim() || item.promptZh?.trim());
  const revealScript =
   showScript || revealedScripts[item.id] || !hideScriptBeforeCheck || isChecked;
  const revealMeaning = showMeaning && (!showTranslationAfterCheck || isChecked);

  return (
   <Card key={item.id} variant="section" padding="md" className="grid gap-3">
    <ItemHeader index={index} type={exerciseType} />
    <div lang="zh-CN" className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
     <div className="grid gap-1">
      <ReaderHanziText displayMode={displayMode} tone="default" leading="relaxed">
       {item.promptZh ?? t("choosePrompt")}
      </ReaderHanziText>
      {revealMeaning && item.metadata.promptVi ? (
       <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
        {item.metadata.promptVi}
       </StudyInstructionText>
      ) : null}
     </div>
     <ExerciseAudioButton
      promptText={item.promptZh}
      transcriptText={transcriptText}
      onSpeak={onSpeak}
     />
    </div>
    <div
     role="radiogroup"
     aria-label={t("question", { number: index + 1 })}
     className="grid gap-2 sm:grid-cols-2"
    >
     {item.options.map((option) => {
      const isSelected = selected === option.key;
      const optionIsCorrect = isChecked && correct === option.key;
      const optionIsWrong = isChecked && isSelected && correct !== option.key;
      return (
       <Button
        key={option.key}
        type="button"
        role="radio"
        aria-checked={isSelected}
        variant={
         optionIsCorrect
          ? "success"
          : optionIsWrong
            ? "destructive"
            : isSelected
              ? "active"
              : "outline"
        }
        size="touch"
        align="start"
        wrap="normal"
        onClick={() => onSelect(item.id, option.key)}
       >
        <Typography
         as="span"
         variant="caption"
         weight="black"
         align="center"
         className="w-6 shrink-0"
        >
         {option.key}
        </Typography>
        <span className="grid min-w-0 gap-0.5">
         <ReaderHanziText displayMode={displayMode}>
          <StressText text={option.textZh} stress={option.stress} />
         </ReaderHanziText>
         {revealMeaning && option.textVi ? (
          <StudyInstructionText variant="caption" tone="muted" weight="medium">
           {option.textVi}
          </StudyInstructionText>
         ) : null}
        </span>
       </Button>
      );
     })}
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <Button
      type="button"
      size="toolbar"
      disabled={!selected || correct === undefined}
      onClick={() => onCheck(item.id)}
     >
      {t("check")}
     </Button>
     {!hasPlayableText ? <Badge variant="warning">{t("noAudio")}</Badge> : null}
     {correct === undefined ? <Badge variant="warning">{t("noAnswer")}</Badge> : null}
     {item.transcript ? (
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       onClick={() => onToggleScript(item.id)}
      >
       {revealScript ? t("hideScript") : t("showScript")}
      </Button>
     ) : null}
     {isChecked ? (
      <StudyInstructionText
       as="span"
       variant="bodySmall"
       tone={isCorrect ? "successStrong" : "danger"}
       weight="bold"
      >
       {isCorrect ? t("correct") : t("incorrectAnswer", { answer: correct ?? "—" })}
      </StudyInstructionText>
     ) : null}
    </div>
    {item.transcript && revealScript ? (
     <ListeningTranscriptBlock
      transcript={item.transcript}
      displayMode={{
       ...displayMode,
       showPinyin,
       showMeaning: revealMeaning,
      }}
      onSpeak={onSpeak}
      onSpeakSequence={onSpeakSequence}
     />
    ) : null}
   </Card>
  );
 });
}
