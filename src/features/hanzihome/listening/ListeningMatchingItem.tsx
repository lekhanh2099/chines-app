"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import {
 StudyInstructionText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import { ExerciseAudioButton, ItemHeader } from "./ListeningExerciseItemParts";
import { isListeningMatchingCorrect } from "./listening-exercise-utils";
import type { ListeningRuntimeItem } from "./listening.types";

export function MatchingItem({
 item,
 transcriptText,
 displayMode,
 onSpeak,
}: {
 item: ListeningRuntimeItem;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
}) {
 const t = useTranslations("Listening");
 const left = item.metadata.left ?? [];
 const right = item.metadata.right ?? [];
 const [activeLeft, setActiveLeft] = useState(left[0]?.id ?? "");
 const [assignments, setAssignments] = useState<Record<string, string>>({});
 const [checked, setChecked] = useState(false);
 const isCorrect = checked && isListeningMatchingCorrect(item, assignments);

 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <ItemHeader index={0} type="matching" />
   <div className="grid gap-1">
    <ReaderHanziText displayMode={displayMode}>{item.promptZh}</ReaderHanziText>
    <ExerciseAudioButton
     promptText={item.promptZh}
     transcriptText={item.transcript?.full.zh ?? transcriptText}
     onSpeak={onSpeak}
    />
   </div>
   <div className="grid gap-2 lg:grid-cols-[14rem_minmax(0,1fr)]">
    <div className="grid content-start gap-2">
     {left.map((entry) => (
      <Button
       key={entry.id}
       type="button"
       variant={activeLeft === entry.id ? "active" : "outline"}
       aria-pressed={activeLeft === entry.id}
       align="start"
       wrap="normal"
       onClick={() => setActiveLeft(entry.id)}
      >
       <ReaderHanziText displayMode={displayMode}>{entry.textZh}</ReaderHanziText>
       {entry.textVi ? (
        <StudyInstructionText as="span" variant="caption" tone="muted">
         {entry.textVi}
        </StudyInstructionText>
       ) : null}
      </Button>
     ))}
    </div>
    <div className="grid content-start gap-2">
     {right.map((entry) => (
      <Button
       key={entry.id}
       type="button"
       variant="outline"
       align="start"
       wrap="normal"
       onClick={() => {
        setAssignments((current) => ({ ...current, [entry.id]: activeLeft }));
        setChecked(false);
       }}
      >
       <ReaderHanziText displayMode={displayMode}>
        {entry.textZh}
        {entry.textVi ? (
         <StudyInstructionText as="span" variant="caption" tone="muted" className="block">
          {entry.textVi}
         </StudyInstructionText>
        ) : null}
       </ReaderHanziText>
       <Badge variant="purple" casing="natural">
        {left.find((candidate) => candidate.id === assignments[entry.id])?.textVi ?? t("unmatched")}
       </Badge>
      </Button>
     ))}
    </div>
   </div>
   <div className="flex items-center gap-2">
    <Button
     type="button"
     size="toolbar"
     disabled={right.some((entry) => !assignments[entry.id])}
     onClick={() => setChecked(true)}
    >
     {t("check")}
    </Button>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     onClick={() => {
      setAssignments({});
      setChecked(false);
     }}
    >
     {t("reset")}
    </Button>
    {checked ? (
     <StudyInstructionText
      as="span"
      variant="bodySmall"
      tone={isCorrect ? "successStrong" : "danger"}
      weight="bold"
     >
      {isCorrect ? t("matched") : t("matchIncorrect")}
     </StudyInstructionText>
    ) : null}
   </div>
  </Card>
 );
}
