"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
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
import type { ListeningRuntimeItem } from "./listening.types";

const AnswerExerciseTypeSchema = z.enum(["short_answer", "oral_response"]);

export function AnswerItems({
 items,
 exerciseType,
 answers,
 revealed,
 onAnswer,
 onReveal,
 showMeaning,
 transcriptText,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 items: ListeningRuntimeItem[];
 exerciseType: z.infer<typeof AnswerExerciseTypeSchema>;
 answers: Record<string, string>;
 revealed: Record<string, boolean>;
 onAnswer: (itemId: string, value: string) => void;
 onReveal: (itemId: string) => void;
 showMeaning: boolean;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 const t = useTranslations("Listening");
 return items.map((item, index) => (
  <Card key={item.id} variant="section" padding="md" className="grid gap-3">
   <ItemHeader
    index={index}
    type={exerciseType}
    onEdit={onEditItem ? () => onEditItem(item) : undefined}
   />
   <div lang="zh-CN" className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
    <div className="grid gap-1">
     <ReaderHanziText displayMode={displayMode} tone="default" leading="relaxed">
      {item.promptZh}
     </ReaderHanziText>
     {showMeaning && item.metadata.promptVi ? (
      <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
       {item.metadata.promptVi}
      </StudyInstructionText>
     ) : null}
    </div>
    <ExerciseAudioButton
     promptText={item.promptZh}
     transcriptText={item.transcript?.full.zh ?? transcriptText}
     onSpeak={onSpeak}
    />
   </div>
   <Textarea
    value={answers[item.id] ?? ""}
    placeholder={
     exerciseType === AnswerExerciseTypeSchema.enum.oral_response
      ? t("oralPlaceholder")
      : t("answerPlaceholder")
    }
    onChange={(event) => onAnswer(item.id, event.target.value)}
   />
   {exerciseType === "oral_response" ? (
    <Badge variant="default" casing="natural" className="justify-self-start">
     {t("oralHelp")}
    </Badge>
   ) : (
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     className="justify-self-start"
     onClick={() => onReveal(item.id)}
    >
     {revealed[item.id] ? t("hideSample") : t("showSample")}
    </Button>
   )}
   {revealed[item.id] && item.metadata.sampleAnswerZh ? (
    <Card variant="subtle" padding="sm">
     <StudyInstructionText
      variant="overline"
      tone="successStrong"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      {t("sample")}
     </StudyInstructionText>
     <ReaderHanziText displayMode={displayMode} tone="default">
      {item.metadata.sampleAnswerZh}
     </ReaderHanziText>
     {showMeaning && item.metadata.sampleAnswerVi ? (
      <StudyInstructionText variant="bodySmall" tone="muted">
       {item.metadata.sampleAnswerVi}
      </StudyInstructionText>
     ) : null}
    </Card>
   ) : null}
  </Card>
 ));
}
