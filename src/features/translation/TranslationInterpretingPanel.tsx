"use client";

import { Mic, Square } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";

import {
 createTranslationSelfMarkSubmission,
 interpretingMarks,
 type createTranslationSubmission,
 type HumanitiesUnitMark,
} from "./translation-workspace-utils";
import type { useTranslationAttempts } from "./useTranslationAttempts";
import type { useTranslationRecording } from "./useTranslationRecording";

type TranslationRecording = ReturnType<typeof useTranslationRecording>;

export function TranslationInterpretingPanel({
 context,
 evaluation,
 preparationRemaining,
 interpretingNotes,
 learnerTranscript,
 unitMarks,
 recorder,
 startRecording,
 submitAttempt,
 onInterpretingNotesChange,
 onLearnerTranscriptChange,
 onUnitMarksChange,
}: {
 context: Parameters<typeof createTranslationSelfMarkSubmission>[0];
 evaluation: NonNullable<Parameters<typeof createTranslationSubmission>[4]>;
 preparationRemaining: number;
 interpretingNotes: string;
 learnerTranscript: string;
 unitMarks: Record<string, HumanitiesUnitMark>;
 recorder: TranslationRecording["recorder"];
 startRecording: TranslationRecording["startRecording"];
 submitAttempt: ReturnType<typeof useTranslationAttempts>["submitAttempt"];
 onInterpretingNotesChange: (value: string) => void;
 onLearnerTranscriptChange: (value: string) => void;
 onUnitMarksChange: (marks: Record<string, HumanitiesUnitMark>) => void;
}) {
 const t = useTranslations("HumanitiesPractice");
 const markLabel = (mark: HumanitiesUnitMark) => {
  if (mark === "kept") return t("answer.marks.kept");
  if (mark === "partial") return t("answer.marks.partial");
  if (mark === "missed") return t("answer.marks.missed");
  return t("answer.marks.unsure");
 };

 return (
  <Card variant="subtle" padding="sm" className="grid gap-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <Typography as="p" variant="caption" weight="black">
     {t("answer.interpreting")}
    </Typography>
    <Badge>
     {preparationRemaining > 0
      ? t("answer.preparing", { seconds: preparationRemaining })
      : t("answer.ready")}
    </Badge>
   </div>
   {evaluation.noteTakingAllowed !== false ? (
    <Textarea
     value={interpretingNotes}
     onChange={(event) => onInterpretingNotesChange(event.target.value)}
     placeholder={t("answer.notesPlaceholder")}
     aria-label={t("answer.notesAria")}
     rows={2}
    />
   ) : null}
   <div className="flex flex-wrap items-center gap-2">
    {recorder.isRecording ? (
     <Button type="button" variant="destructive" onClick={recorder.stop}>
      <Square data-icon="inline-start" />
      {t("answer.stopRecording", { seconds: recorder.durationSeconds })}
     </Button>
    ) : (
     <Button
      type="button"
      disabled={recorder.isRequesting || !recorder.isSupported}
      onClick={startRecording}
     >
      <Mic data-icon="inline-start" />
      {recorder.isRequesting ? t("answer.requestingPermission") : t("answer.startRecording")}
     </Button>
    )}
    {recorder.audioUrl ? (
     <audio controls preload="metadata" src={recorder.audioUrl} className="min-w-0 max-w-full" />
    ) : null}
   </div>
   <Textarea
    value={learnerTranscript}
    onChange={(event) => onLearnerTranscriptChange(event.target.value)}
    placeholder={t("answer.transcriptPlaceholder")}
    aria-label={t("answer.transcriptAria")}
    rows={2}
   />
   {evaluation.informationUnits.length > 0 ? (
    <div className="grid gap-2">
     <Typography as="p" variant="caption" tone="muted" weight="black">
      {t("answer.selfMark")}
     </Typography>
     {evaluation.informationUnits.map((unit) => (
      <div key={unit.id} className="flex min-w-0 flex-wrap items-center gap-1">
       <Typography as="span" variant="caption" className="min-w-40">
        {unit.canonicalMeaningVi}
       </Typography>
       {interpretingMarks.map((mark) => (
        <Button
         key={mark}
         type="button"
         size="sm"
         variant={unitMarks[unit.id] === mark ? "active" : "outline"}
         onClick={() => {
          const nextMarks = { ...unitMarks, [unit.id]: mark };
          onUnitMarksChange(nextMarks);
          submitAttempt(createTranslationSelfMarkSubmission(context, nextMarks));
         }}
        >
         {markLabel(mark)}
        </Button>
       ))}
      </div>
     ))}
    </div>
   ) : null}
   {recorder.error ? (
    <Typography as="p" variant="caption" tone="danger">
     {t("answer.recordingError")}
    </Typography>
   ) : null}
  </Card>
 );
}
