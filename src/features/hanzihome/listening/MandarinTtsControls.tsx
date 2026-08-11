"use client";

import { Label } from "@/components/ui/label";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useId } from "react";
import { Play, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IconTile } from "@/components/ui/icon-tile";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import type { useTTS } from "@/hooks/useTTS";

export type MandarinTtsController = ReturnType<typeof useTTS>;

const rateOptions = [
 { value: "0.75", rate: 0.75 },
 { value: "0.9", rate: 0.9 },
 { value: "1", rate: 1 },
 { value: "1.1", rate: 1.1 },
 { value: "1.25", rate: 1.25 },
];

type MandarinTtsControlsProps = {
 text: string;
 tts: MandarinTtsController;
 hideScriptBeforeCheck?: boolean;
 onHideScriptBeforeCheckChange?: (checked: boolean) => void;
 showTranslationAfterCheck?: boolean;
 onShowTranslationAfterCheckChange?: (checked: boolean) => void;
};

export function MandarinTtsControls({
 text,
 tts,
 hideScriptBeforeCheck,
 onHideScriptBeforeCheckChange,
 showTranslationAfterCheck,
 onShowTranslationAfterCheckChange,
}: MandarinTtsControlsProps) {
 const hideScriptId = useId();
 const showTranslationId = useId();
 const showPracticePreferences =
  onHideScriptBeforeCheckChange !== undefined && onShowTranslationAfterCheckChange !== undefined;

 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-2">
     <IconTile tone="accent" size="sm">
      <Volume2 />
     </IconTile>
     <div className="min-w-0">
      <StudyInstructionText variant="label" tone="default" weight="black">
       Thiết lập nghe
      </StudyInstructionText>
      <StudyInstructionText variant="caption" tone="muted" weight="medium" leading="relaxed">
       {tts.error ?? "Giọng Mandarin zh-CN từ Microsoft Edge Read Aloud."}
      </StudyInstructionText>
     </div>
    </div>

    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
     <Select value={tts.selectedVoiceName} onValueChange={tts.setSelectedVoiceName}>
      <SelectTrigger
       size="sm"
       aria-label="Chọn giọng Mandarin"
       className="min-w-52 max-w-full sm:min-w-64"
      >
       <SelectValue placeholder="Chọn giọng Mandarin zh-CN" />
      </SelectTrigger>
      <SelectContent align="end">
       <SelectGroup>
        {tts.voices.map((voice) => (
         <SelectItem key={voice.shortName} value={voice.shortName}>
          {voice.name} · {voice.gender}
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>

     <Select
      value={rateOptions.find((option) => option.rate === tts.rate)?.value}
      onValueChange={(value) => {
       const option = rateOptions.find((candidate) => candidate.value === value);
       if (option) tts.setRate(option.rate);
      }}
     >
      <SelectTrigger size="sm" aria-label="Chọn tốc độ đọc" className="w-24">
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
       <SelectGroup>
        {rateOptions.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          {option.value}×
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>

     <Button
      type="button"
      variant="surfaceCard"
      size="toolbar"
      disabled={!text.trim() || !tts.selectedVoice}
      onClick={() => tts.speakSequence(text.split("\n"))}
     >
      <Play data-icon="inline-start" />
      Phát cả phần
     </Button>
     <Button
      type="button"
      variant="ghost"
      size="toolbar"
      disabled={!tts.isSpeaking && !tts.isLoading}
      onClick={tts.stop}
     >
      <Square data-icon="inline-start" />
      Dừng
     </Button>
    </div>
   </div>

   {showPracticePreferences ? (
    <>
     <Separator />
     <div className="flex flex-wrap gap-x-5 gap-y-2">
      <Label
       htmlFor={hideScriptId}
       variant="caption"
       tone="secondary"
       weight="bold"
       className="flex min-h-9 items-center gap-2"
      >
       <Checkbox
        id={hideScriptId}
        checked={hideScriptBeforeCheck}
        onCheckedChange={(checked) => onHideScriptBeforeCheckChange(checked === true)}
       />
       Ẩn script trước khi làm
      </Label>
      <Label
       htmlFor={showTranslationId}
       variant="caption"
       tone="secondary"
       weight="bold"
       className="flex min-h-9 items-center gap-2"
      >
       <Checkbox
        id={showTranslationId}
        checked={showTranslationAfterCheck}
        onCheckedChange={(checked) => onShowTranslationAfterCheckChange(checked === true)}
       />
       Hiện bản dịch sau khi kiểm tra
      </Label>
     </div>
    </>
   ) : null}
  </Card>
 );
}
