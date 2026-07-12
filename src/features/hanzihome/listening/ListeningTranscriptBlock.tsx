import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHanziTypographyStyle } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";

import type { ListeningTranscript } from "./listening.types";

export function ListeningTranscriptBlock({
 transcript,
 displayMode,
 onSpeak,
}: {
 transcript: ListeningTranscript;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
}) {
 const speakerById = new Map(transcript.speakers.map((speaker) => [speaker.id, speaker]));

 return (
  <Card variant="subtle" padding="sm" className="grid gap-1 rounded-xl">
   <div className="flex items-center justify-between gap-2 border-b border-border-default pb-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-secondary">Script đáp án</p>
    <div className="flex items-center gap-2">
     <Badge variant="default">{transcript.mode === "dialogue" ? "Hội thoại" : "Độc thoại"}</Badge>
     <Button type="button" variant="outline" size="sm" onClick={() => onSpeak(transcript.full.zh)}>
      <Play data-icon="inline-start" />
      Đọc đoạn
     </Button>
    </div>
   </div>

   <div className="grid">
    {transcript.lines.map((line) => {
     const speaker = speakerById.get(line.speakerId);
     return (
      <div
       key={`${line.speakerId}:${line.order}`}
       className="grid gap-2 border-b border-border-default py-2 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)]"
      >
       <div className="text-xs font-black text-primary">
        <Badge variant="purple" className="w-fit normal-case tracking-normal">
         {speaker?.labelZh ?? line.speakerId}
        </Badge>
        {speaker?.labelVi ? (
         <span className="block font-semibold text-text-muted">{speaker.labelVi}</span>
        ) : null}
       </div>
       <div lang="zh-CN" className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div>
         <p
          className="leading-[1.7] text-text-primary"
          style={getHanziTypographyStyle(displayMode)}
         >
          {line.zh}
         </p>
         {displayMode.showPinyin ? (
          <p className="text-sm font-semibold text-accent-text">{line.pinyin}</p>
         ) : null}
         {displayMode.showMeaning && line.vi ? (
          <p className="text-sm font-medium leading-relaxed text-text-muted">{line.vi}</p>
         ) : null}
        </div>
        <Button
         type="button"
         variant="ghost"
         size="icon-sm"
         aria-label={`Đọc dòng ${line.order}`}
         title={`Đọc dòng ${line.order}`}
         onClick={() => onSpeak(line.zh)}
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
