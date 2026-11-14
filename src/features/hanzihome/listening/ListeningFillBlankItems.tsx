"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import {
 StudyInstructionText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import {
 ExerciseAudioButton,
 ItemHeader,
 type ListeningItemEditHandler,
} from "./ListeningExerciseItemParts";
import { isListeningBlankCorrect } from "./listening-exercise-utils";
import type { ListeningRuntimeItem } from "./listening.types";

export function FillBlankItems({
 items,
 answers,
 checked,
 onAnswer,
 onCheck,
 transcriptText,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 items: ListeningRuntimeItem[];
 answers: Record<string, string>;
 checked: Record<string, boolean>;
 onAnswer: (itemId: string, value: string) => void;
 onCheck: (itemId: string) => void;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 const t = useTranslations("Listening");
 return items.map((item, index) => {
  const accepted = item.metadata.acceptedAnswers ?? [];
  const isChecked = checked[item.id] ?? false;
  const isCorrect = isChecked && isListeningBlankCorrect(item, answers[item.id] ?? "");
  const parts = item.metadata.promptParts ?? [item.promptZh ?? "", ""];
  return (
   <Card key={item.id} variant="section" padding="md" className="grid gap-3">
    <ItemHeader
     index={index}
     type="fill_blank"
     onEdit={onEditItem ? () => onEditItem(item) : undefined}
    />
    <ReaderHanziText
     as="div"
     displayMode={displayMode}
     className="flex flex-wrap items-center gap-2"
    >
     <StudyInstructionText as="span" weight="black">
      {index + 1}.
     </StudyInstructionText>
     <StudyInstructionText as="span" weight="bold">
      {parts[0]}
     </StudyInstructionText>
     <Input
      value={answers[item.id] ?? ""}
      aria-label={t("answerAria", { number: index + 1 })}
      validation={isChecked ? (isCorrect ? "success" : "danger") : "none"}
      className="w-28"
      onChange={(event) => onAnswer(item.id, event.target.value)}
     />
     <StudyInstructionText as="span" weight="bold">
      {parts[1]}
     </StudyInstructionText>
    </ReaderHanziText>
    <ExerciseAudioButton
     promptText={item.promptZh}
     transcriptText={item.transcript?.full.zh ?? transcriptText}
     onSpeak={onSpeak}
    />
    <div className="flex items-center gap-2">
     <Button type="button" size="toolbar" onClick={() => onCheck(item.id)}>
      {t("check")}
     </Button>
     {isChecked ? (
      <StudyInstructionText
       as="span"
       variant="bodySmall"
       tone={isCorrect ? "successStrong" : "danger"}
       weight="bold"
      >
       {isCorrect ? t("correct") : `✕ ${item.metadata.answerDisplay ?? accepted[0] ?? ""}`}
      </StudyInstructionText>
     ) : null}
    </div>
   </Card>
  );
 });
}
