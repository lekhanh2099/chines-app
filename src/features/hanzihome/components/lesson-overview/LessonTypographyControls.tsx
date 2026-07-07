"use client";

import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type HanziReaderFont,
 type HanziReaderSize,
 type LessonDisplayMode,
} from "./types";

const hanziFontOptions: Array<{ value: HanziReaderFont; label: string }> = [
 { value: "mengshen", label: "Mộng Thần" },
 { value: "kai", label: "Kai" },
 { value: "pinyin", label: "Pinyin" },
 { value: "songti", label: "Songti" },
 { value: "system", label: "Hệ thống" },
];

const hanziSizeOptions: Array<{ value: HanziReaderSize; label: string }> = [
 { value: "md", label: "Vừa" },
 { value: "lg", label: "Lớn" },
 { value: "xl", label: "Rất lớn" },
 { value: "2xl", label: "Siêu lớn" },
 { value: "3xl", label: "Cực lớn" },
];

type LessonTypographyControlsProps = {
 displayMode: LessonDisplayMode;
 onChange: (updates: Partial<Pick<LessonDisplayMode, "hanziFont" | "hanziSize">>) => void;
};

function parseHanziReaderFont(value: string): HanziReaderFont {
 return (
  hanziFontOptions.find((option) => option.value === value)?.value ??
  DEFAULT_LESSON_DISPLAY_MODE.hanziFont
 );
}

function parseHanziReaderSize(value: string): HanziReaderSize {
 return (
  hanziSizeOptions.find((option) => option.value === value)?.value ??
  DEFAULT_LESSON_DISPLAY_MODE.hanziSize
 );
}

export function LessonTypographyControls({ displayMode, onChange }: LessonTypographyControlsProps) {
 return (
  <div className="study-toolbar inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg border p-1">
   <span className="px-1 text-xs font-black uppercase tracking-wide text-text-muted">Chữ</span>
   <div className="flex min-w-0 items-center gap-1">
    <span className="hidden px-1 text-xs font-bold text-text-muted sm:inline">Font</span>
    <Select
     value={displayMode.hanziFont}
     onValueChange={(value) => onChange({ hanziFont: parseHanziReaderFont(value) })}
    >
     <SelectTrigger size="sm" className="h-7 min-w-24 bg-bg-primary shadow-none sm:min-w-32">
      <SelectValue />
     </SelectTrigger>
     <SelectContent align="end">
      <SelectGroup>
       {hanziFontOptions.map((option) => (
        <SelectItem key={option.value} value={option.value}>
         {option.label}
        </SelectItem>
       ))}
      </SelectGroup>
     </SelectContent>
    </Select>
   </div>
   <div className="flex min-w-0 items-center gap-1">
    <span className="px-1 text-xs font-bold text-text-muted">Cỡ</span>
    <Select
     value={displayMode.hanziSize}
     onValueChange={(value) => onChange({ hanziSize: parseHanziReaderSize(value) })}
    >
     <SelectTrigger size="sm" className="h-7 min-w-20 bg-bg-primary shadow-none sm:min-w-24">
      <SelectValue />
     </SelectTrigger>
     <SelectContent align="end">
      <SelectGroup>
       {hanziSizeOptions.map((option) => (
        <SelectItem key={option.value} value={option.value}>
         {option.label}
        </SelectItem>
       ))}
      </SelectGroup>
     </SelectContent>
    </Select>
   </div>
  </div>
 );
}
