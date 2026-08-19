"use client";

import { ChevronDown, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TTSVoice } from "@/hooks/useTTS";

export type StudioDictationScriptMode = "hidden" | "pinyin" | "hanzi";

const rateOptions = [0.65, 0.8, 0.9, 1, 1.1, 1.25, 1.35];

export function StudioDictationSettingsMenu({
 autoAdvance,
 loopCurrent,
 rate,
 scriptMode,
 selectedVoiceName,
 voices,
 onAutoAdvanceChange,
 onLoopCurrentChange,
 onRateChange,
 onScriptModeChange,
 onVoiceChange,
}: {
 autoAdvance: boolean;
 loopCurrent: boolean;
 rate: number;
 scriptMode: StudioDictationScriptMode;
 selectedVoiceName: string;
 voices: TTSVoice[];
 onAutoAdvanceChange: (next: boolean) => void;
 onLoopCurrentChange: (next: boolean) => void;
 onRateChange: (next: number) => void;
 onScriptModeChange: (next: StudioDictationScriptMode) => void;
 onVoiceChange: (next: string) => void;
}) {
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button type="button" variant="outline" size="toolbar">
     <Settings2 data-icon="inline-start" />
     Cài đặt
     <ChevronDown data-icon="inline-end" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" width="lg">
    <DropdownMenuLabel>Nghe chép</DropdownMenuLabel>
    <DropdownMenuCheckboxItem
     checked={loopCurrent}
     onCheckedChange={(next) => onLoopCurrentChange(next === true)}
    >
     Lặp phần hiện tại
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem
     checked={autoAdvance}
     onCheckedChange={(next) => onAutoAdvanceChange(next === true)}
    >
     Tự chuyển khi phát xong
    </DropdownMenuCheckboxItem>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
     <DropdownMenuSubTrigger>Giọng đọc</DropdownMenuSubTrigger>
     <DropdownMenuSubContent width="lg">
      <DropdownMenuLabel>Giọng đọc</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={selectedVoiceName} onValueChange={onVoiceChange}>
       {voices.map((voice) => (
        <DropdownMenuRadioItem key={voice.shortName} value={voice.shortName}>
         {voice.name} · {voice.gender}
        </DropdownMenuRadioItem>
       ))}
      </DropdownMenuRadioGroup>
     </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSub>
     <DropdownMenuSubTrigger>Tốc độ · {rate.toFixed(2)}×</DropdownMenuSubTrigger>
     <DropdownMenuSubContent width="sm">
      <DropdownMenuRadioGroup
       value={String(rate)}
       onValueChange={(value) => {
        const next = Number(value);
        if (Number.isFinite(next)) onRateChange(next);
       }}
      >
       {rateOptions.map((option) => (
        <DropdownMenuRadioItem key={option} value={String(option)}>
         {option.toFixed(2)}×
        </DropdownMenuRadioItem>
       ))}
      </DropdownMenuRadioGroup>
     </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Hỗ trợ khi nghe</DropdownMenuLabel>
    <DropdownMenuRadioGroup
     value={scriptMode}
     onValueChange={(value) => {
      if (value === "hidden" || value === "pinyin" || value === "hanzi") {
       onScriptModeChange(value);
      }
     }}
    >
     <DropdownMenuRadioItem value="hidden">Ẩn gợi ý</DropdownMenuRadioItem>
     <DropdownMenuRadioItem value="pinyin">Hiện pinyin</DropdownMenuRadioItem>
     <DropdownMenuRadioItem value="hanzi">Hiện chữ Hán</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
