"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
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
import { isListeningBooleanCorrect } from "./listening-exercise-utils";
import type { ListeningRuntimeItem } from "./listening.types";

const BooleanExerciseTypeSchema = z.enum(["true_false", "same_different"]);

export function BooleanItems({
 items,
 exerciseType,
 selections,
 checked,
 revealed,
 onSelect,
 onCheck,
 onReveal,
 showMeaning,
 transcriptText,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 items: ListeningRuntimeItem[];
 exerciseType: z.infer<typeof BooleanExerciseTypeSchema>;
 selections: Record<string, string>;
 checked: Record<string, boolean>;
 revealed: Record<string, boolean>;
 onSelect: (itemId: string, value: string) => void;
 onCheck: (itemId: string) => void;
 onReveal: (itemId: string) => void;
 showMeaning: boolean;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 const t = useTranslations("Listening");
 return items.map((item, index) => {
  const selected = selections[item.id];
  const isChecked = checked[item.id] ?? false;
  const isCorrect = isChecked && isListeningBooleanCorrect(item, selected ?? "");
  const sameDifferent = exerciseType === BooleanExerciseTypeSchema.enum.same_different;
  return (
   <Card key={item.id} variant="section" padding="md" className="grid gap-3">
    <ItemHeader
     index={index}
     type={exerciseType}
     onEdit={onEditItem ? () => onEditItem(item) : undefined}
    />
    <div className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
     <ReaderHanziText displayMode={displayMode} tone="default" leading="relaxed">
      {sameDifferent ? item.metadata.printedPinyin : item.promptZh}
     </ReaderHanziText>
     <ExerciseAudioButton
      promptText={sameDifferent ? (item.metadata.heardZh ?? item.promptZh) : item.promptZh}
      transcriptText={item.transcript?.full.zh ?? transcriptText}
      onSpeak={onSpeak}
     />
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <SegmentedControl<string>
      value={selected ?? ""}
      items={[
       { key: "true", label: sameDifferent ? t("same") : t("true") },
       { key: "false", label: sameDifferent ? t("different") : t("false") },
      ]}
      onChange={(value) => onSelect(item.id, value)}
      density="toolbar"
      aria-label={t("selectAnswer", { number: index + 1 })}
      className="justify-self-start"
     />
     <Button type="button" size="toolbar" disabled={!selected} onClick={() => onCheck(item.id)}>
      {t("check")}
     </Button>
     {sameDifferent ? (
      <Button type="button" variant="outline" size="toolbar" onClick={() => onReveal(item.id)}>
       {revealed[item.id] ? t("hideScript") : t("viewScript")}
      </Button>
     ) : null}
     {isChecked ? (
      <StudyInstructionText
       as="span"
       variant="bodySmall"
       tone={isCorrect ? "successStrong" : "danger"}
       weight="bold"
      >
       {isCorrect ? t("correct") : t("incorrect")}
      </StudyInstructionText>
     ) : null}
    </div>
    {sameDifferent && revealed[item.id] ? (
     <Card variant="subtle" padding="sm">
      <ReaderHanziText displayMode={displayMode} tone="default">
       {item.metadata.heardZh}
      </ReaderHanziText>
      <StudyInstructionText variant="bodySmall" tone="accent" weight="semibold">
       {item.metadata.heardPinyin}
      </StudyInstructionText>
     </Card>
    ) : null}
    {isChecked && item.explanationVi && showMeaning ? (
     <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
      {item.explanationVi}
     </StudyInstructionText>
    ) : null}
   </Card>
  );
 });
}
