"use client";

import { useTranslations } from "next-intl";

import { Pencil, Play } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import { splitListeningStress } from "./listening-exercise-utils";
import type {
 ListeningExerciseType,
 ListeningRuntimeItem,
 ListeningTranscript,
} from "./listening.types";

export type ListeningExerciseItemsProps = {
 exerciseType: ListeningExerciseType;
 items: ListeningRuntimeItem[];
 sharedTranscript?: ListeningTranscript;
 showPinyin: boolean;
 showMeaning: boolean;
 showScript: boolean;
 hideScriptBeforeCheck: boolean;
 showTranslationAfterCheck: boolean;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onSpeakSequence: (segments: string[]) => void;
 lessonId: string;
};

export type ListeningItemEditHandler = (item: ListeningRuntimeItem) => void;

export function ExerciseAudioButton({
 promptText,
 transcriptText,
 onSpeak,
}: {
 promptText?: string;
 transcriptText?: string;
 onSpeak: (text: string) => void;
}) {
 const t = useTranslations("Listening");
 const text = [transcriptText?.trim(), promptText?.trim()].filter(Boolean).join("\n");
 if (!text) return null;

 return (
  <Button
   type="button"
   variant="surface"
   size="toolbar"
   className="justify-self-start shrink-0"
   title={t("audioHelp")}
   onClick={() => onSpeak(text)}
  >
   <Play data-icon="inline-start" />
   {transcriptText ? t("listenSentence") : t("readQuestion")}
  </Button>
 );
}

export function ItemHeader({
 index,
 type,
 onEdit,
}: {
 index: number;
 type: ListeningExerciseType;
 onEdit?: () => void;
}) {
 const t = useTranslations("Listening");
 const typeLabels = new Map([
  ["single_choice", t("exerciseTypes.single_choice")],
  ["short_answer", t("exerciseTypes.short_answer")],
  ["oral_response", t("exerciseTypes.oral_response")],
  ["true_false", t("exerciseTypes.true_false")],
  ["matching", t("exerciseTypes.matching")],
  ["same_different", t("exerciseTypes.same_different")],
  ["shadowing", t("exerciseTypes.shadowing")],
  ["stress_choice", t("exerciseTypes.stress_choice")],
  ["fill_blank", t("exerciseTypes.fill_blank")],
 ]);
 return (
  <div className="flex items-center gap-2">
   <IconTile size="sm">
    <Typography variant="caption" weight="black">
     {index + 1}
    </Typography>
   </IconTile>
   <span className="sr-only">{t("question", { number: index + 1 })}.</span>
   <StudyInstructionText
    variant="overline"
    tone="successStrong"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    {typeLabels.get(type)}
   </StudyInstructionText>
   {onEdit ? (
    <Button
     type="button"
     variant="outline"
     size="icon-toolbar"
     className="ml-auto"
     aria-label={t("editQuestion")}
     title={t("editQuestion")}
     onClick={onEdit}
    >
     <Pencil />
    </Button>
   ) : null}
  </div>
 );
}

export function StressText({ text, stress }: { text: string; stress?: string[] }) {
 return splitListeningStress(text, stress).map((part, index) =>
  part.stressed ? (
   <mark
    key={`${part.text}:${index}`}
    className="rounded bg-warning-subtle px-0.5 text-inherit underline"
   >
    {part.text}
   </mark>
  ) : (
   part.text
  ),
 );
}
