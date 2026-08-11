import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
 StudyInstructionText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import type { ListeningTranscript } from "./listening.types";

export function ListeningTranscriptBlock({
 transcript,
 displayMode,
 onSpeak,
 onSpeakSequence,
}: {
 transcript: ListeningTranscript;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onSpeakSequence: (segments: string[]) => void;
}) {
 const speakerById = new Map(transcript.speakers.map((speaker) => [speaker.id, speaker]));

 return (
  <Card variant="default" padding="sm" className="grid gap-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <StudyInstructionText
     variant="overline"
     tone="secondary"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     Script đáp án
    </StudyInstructionText>
    <div className="flex items-center gap-2">
     <Badge variant="default">{transcript.mode === "dialogue" ? "Hội thoại" : "Độc thoại"}</Badge>
     <Button
      type="button"
      variant="outline"
      size="toolbar"
      onClick={() =>
       onSpeakSequence(
        transcript.lines.length > 0
         ? transcript.lines.map((line) => line.zh)
         : [transcript.full.zh],
       )
      }
     >
      <Play data-icon="inline-start" />
      Đọc đoạn
     </Button>
    </div>
   </div>

   <Separator />

   <div className="grid gap-0">
    {transcript.lines.map((line, index) => {
     const speaker = speakerById.get(line.speakerId);
     return (
      <div
       key={`${line.speakerId}:${line.order}`}
       className="grid gap-2 py-3 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
      >
       <div>
        <Badge
         variant={speaker?.voice === "male" ? "info" : "purple"}
         casing="natural"
         className="w-fit"
        >
         {speaker?.labelZh ?? line.speakerId}
        </Badge>
        {speaker?.labelVi ? (
         <StudyInstructionText tone="muted" weight="semibold" className="mt-1 block">
          {speaker.labelVi}
         </StudyInstructionText>
        ) : null}
       </div>
       <div lang="zh-CN" className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div>
         <ReaderHanziText
          displayMode={displayMode}
          tone="default"
          weight="medium"
          leading="learner"
         >
          {line.zh}
         </ReaderHanziText>
         {displayMode.showPinyin ? (
          <StudyInstructionText variant="bodySmall" tone="accent" weight="semibold">
           {line.pinyin}
          </StudyInstructionText>
         ) : null}
         {displayMode.showMeaning && line.vi ? (
          <StudyInstructionText
           variant="bodySmall"
           tone="secondary"
           weight="medium"
           leading="relaxed"
          >
           {line.vi}
          </StudyInstructionText>
         ) : null}
        </div>
        <Button
         type="button"
         variant="ghost"
         size="icon-toolbar"
         aria-label={`Đọc dòng ${line.order}`}
         title={`Đọc dòng ${line.order}`}
         onClick={() => onSpeak(line.zh)}
        >
         <Play />
        </Button>
       </div>
       {index < transcript.lines.length - 1 ? (
        <div className="sm:col-span-2">
         <Separator />
        </div>
       ) : null}
      </div>
     );
    })}
   </div>
  </Card>
 );
}
