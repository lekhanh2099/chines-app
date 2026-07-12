"use client";

import { useId } from "react";
import { Play, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

import type { useNativeMandarinTts } from "./useNativeMandarinTts";

export type NativeMandarinTtsController = ReturnType<typeof useNativeMandarinTts>;

type NativeMandarinTtsControlsProps = {
 text: string;
 tts: NativeMandarinTtsController;
 hideScriptBeforeCheck?: boolean;
 onHideScriptBeforeCheckChange?: (checked: boolean) => void;
 showTranslationAfterCheck?: boolean;
 onShowTranslationAfterCheckChange?: (checked: boolean) => void;
};

export function NativeMandarinTtsControls({
 text,
 tts,
 hideScriptBeforeCheck,
 onHideScriptBeforeCheckChange,
 showTranslationAfterCheck,
 onShowTranslationAfterCheckChange,
}: NativeMandarinTtsControlsProps) {
 const hideScriptId = useId();
 const showTranslationId = useId();
 const showPracticePreferences =
  onHideScriptBeforeCheckChange !== undefined && onShowTranslationAfterCheckChange !== undefined;

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3">
   <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-2">
     <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
      <Volume2 className="size-4" />
     </span>
     <div className="min-w-0">
      <p className="text-sm font-black text-text-primary">Thiết lập nghe</p>
      <p className="text-xs font-medium leading-relaxed text-text-muted">
       {tts.error ?? "Giọng Mandarin Trung Quốc đại lục do thiết bị cung cấp."}
      </p>
     </div>
    </div>

    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
     <Select value={tts.selectedVoiceUri} onValueChange={tts.setSelectedVoiceUri}>
      <SelectTrigger
       size="sm"
       aria-label="Chọn giọng Mandarin"
       className="min-w-52 max-w-full bg-bg-card sm:min-w-64"
      >
       <SelectValue placeholder="Chọn giọng Mandarin zh-CN" />
      </SelectTrigger>
      <SelectContent align="end">
       <SelectGroup>
        {tts.voices.map((voice) => (
         <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
          {voice.name} · {voice.localService ? "native" : "online"}
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>

     <Select value={String(tts.rate)} onValueChange={(value) => tts.setRate(Number(value))}>
      <SelectTrigger size="sm" aria-label="Chọn tốc độ đọc" className="w-24 bg-bg-card">
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
       <SelectGroup>
        {["0.75", "0.9", "1", "1.1", "1.25"].map((value) => (
         <SelectItem key={value} value={value}>
          {value}×
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>

     <Button
      type="button"
      variant="surfaceCard"
      size="sm"
      disabled={!text.trim() || !tts.selectedVoice}
      onClick={() => tts.speak(text)}
     >
      <Play data-icon="inline-start" />
      Phát cả phần
     </Button>
     <Button type="button" variant="ghost" size="sm" disabled={!tts.isSpeaking} onClick={tts.stop}>
      <Square data-icon="inline-start" />
      Dừng
     </Button>
    </div>
   </div>

   {showPracticePreferences ? (
    <div className="flex flex-wrap gap-2 border-t border-border-default pt-2.5">
     <label
      htmlFor={hideScriptId}
      className="flex min-h-9 items-center gap-2 rounded-lg border border-border-default bg-bg-card px-3 text-xs font-bold text-text-secondary"
     >
      <Checkbox
       id={hideScriptId}
       checked={hideScriptBeforeCheck}
       onCheckedChange={(checked) => onHideScriptBeforeCheckChange(checked === true)}
      />
      Ẩn script trước khi làm
     </label>
     <label
      htmlFor={showTranslationId}
      className="flex min-h-9 items-center gap-2 rounded-lg border border-border-default bg-bg-card px-3 text-xs font-bold text-text-secondary"
     >
      <Checkbox
       id={showTranslationId}
       checked={showTranslationAfterCheck}
       onCheckedChange={(checked) => onShowTranslationAfterCheckChange(checked === true)}
      />
      Hiện bản dịch sau khi kiểm tra
     </label>
    </div>
   ) : null}
  </div>
 );
}
