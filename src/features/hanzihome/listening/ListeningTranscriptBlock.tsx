import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 StudyInstructionText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import type { ListeningTranscript, ListeningTranscriptVoice } from "./listening.types";
import type { MandarinSpeechSegment } from "./useNativeMandarinTts";

export function ListeningTranscriptBlock({
 transcript,
 displayMode,
 onSpeak,
 onSpeakSequence,
}: {
 transcript: ListeningTranscript;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string, voice?: ListeningTranscriptVoice) => void;
 onSpeakSequence: (segments: MandarinSpeechSegment[]) => void;
}) {
 const speakerById = new Map(transcript.speakers.map((speaker) => [speaker.id, speaker]));

 return (
  <Card variant="default" padding="sm" className="grid gap-2 rounded-xl">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2.5">
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
      size="sm"
      onClick={() =>
       onSpeakSequence(
        transcript.lines.length > 0
         ? transcript.lines.map((line) => ({
            text: line.zh,
            voice: speakerById.get(line.speakerId)?.voice,
           }))
         : [{ text: transcript.full.zh, voice: "neutral" }],
       )
      }
     >
      <Play data-icon="inline-start" />
      Đọc đoạn
     </Button>
    </div>
   </div>

   <div className="grid gap-1.5">
    {transcript.lines.map((line) => {
     const speaker = speakerById.get(line.speakerId);
     return (
      <div
       key={`${line.speakerId}:${line.order}`}
       className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle px-2.5 py-2.5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:px-3"
      >
       <div className="text-xs font-black text-primary">
        <Badge
         variant={speaker?.voice === "male" ? "info" : "purple"}
         className="w-fit normal-case tracking-normal"
        >
         {speaker?.labelZh ?? line.speakerId}
        </Badge>
        {speaker?.labelVi ? (
         <StudyInstructionText tone="muted" weight="semibold" className="block">
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
         size="icon-sm"
         aria-label={`Đọc dòng ${line.order}`}
         title={`Đọc dòng ${line.order}`}
         onClick={() => onSpeak(line.zh, speaker?.voice)}
        >
         <Play />
        </Button>
       </div>
      </div>
     );
    })}
   </div>
  </Card>
 );
}
