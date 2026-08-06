"use client";

import { Typography } from "@/components/ui/typography";
import { Eye, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { z } from "zod";

import { HanziFontPreview, HanziText, StudyInstructionText } from "./hanzi-typography";
import type { HanziReaderFont, HanziReaderSize, LessonDisplayMode } from "./types";

const fontOptions: Array<{ value: HanziReaderFont; label: string }> = [
 { value: "system", label: "Hệ thống" },
 { value: "songti", label: "Noto Serif SC" },
 { value: "noto-sans", label: "Noto Sans SC" },
 { value: "pinyin", label: "Pinyin" },
 { value: "kaiti", label: "Khải thư · 楷体" },
 { value: "fangsong", label: "Phỏng Tống · 仿宋" },
 { value: "ma-shan", label: "Ma Shan Zheng" },
 { value: "xiaowei", label: "ZCOOL XiaoWei" },
];

const sizeOptions: Array<{
 value: HanziReaderSize;
 label: string;
 sample: string;
}> = [
 { value: "md", label: "Vừa", sample: "A" },
 { value: "lg", label: "Lớn", sample: "A" },
 { value: "xl", label: "Rất lớn", sample: "A" },
 { value: "2xl", label: "Siêu lớn", sample: "A" },
 { value: "3xl", label: "Cực lớn", sample: "A" },
];

const LessonReadingVisibilityKeySchema = z.enum(["showPinyin", "showMeaning", "showAnswers"]);

const visibilityOptions: Array<{
 key: z.infer<typeof LessonReadingVisibilityKeySchema>;
 label: string;
}> = [
 { key: LessonReadingVisibilityKeySchema.enum.showPinyin, label: "Pinyin" },
 { key: "showMeaning", label: "Nghĩa" },
 { key: "showAnswers", label: "Đáp án" },
];

const revealOptions: Array<{
 value: LessonDisplayMode["revealMode"];
 label: string;
}> = [
 { value: "always", label: "Hiện sẵn" },
 { value: "tap", label: "Bấm để mở" },
];

type LessonReadingSettingsProps = {
 displayMode: LessonDisplayMode;
 onChange: (updates: Partial<LessonDisplayMode>) => void;
 className?: string;
};

export function LessonReadingSettings({
 displayMode,
 onChange,
 className,
}: LessonReadingSettingsProps) {
 return (
  <div className={cn("grid min-w-0 gap-2", className)}>
   <SettingsGroup icon={<Type />} label="Kiểu chữ">
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
     {fontOptions.map((option) => {
      const active = displayMode.hanziFont === option.value;
      return (
       <Button
        key={option.value}
        variant={active ? "active" : "surfaceCard"}
        size="sm"
        aria-pressed={active}
        onClick={() => onChange({ hanziFont: option.value })}
       >
        <HanziFontPreview as="span" font={option.value} leading="none">
         文
        </HanziFontPreview>
        <StudyInstructionText as="span" clamp="one">
         {option.label}
        </StudyInstructionText>
       </Button>
      );
     })}
    </div>
   </SettingsGroup>

   <SettingsGroup icon={<Type />} label="Cỡ chữ">
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
     {sizeOptions.map((option, index) => {
      const active = displayMode.hanziSize === option.value;
      return (
       <Button
        key={option.value}
        variant={active ? "active" : "surfaceCard"}
        size="sm"
        wrap="normal"
        className="min-w-0 flex-col"
        aria-pressed={active}
        onClick={() => onChange({ hanziSize: option.value })}
       >
        <HanziText
         as="span"
         size={index < 2 ? "small" : index < 4 ? "medium" : "large"}
         leading="none"
        >
         {option.sample}
        </HanziText>
        <StudyInstructionText as="span" variant="caption" leading="tight" scale="micro">
         {option.label}
        </StudyInstructionText>
       </Button>
      );
     })}
    </div>
   </SettingsGroup>

   <SettingsGroup icon={<Eye />} label="Cách mở nội dung">
    <div className="grid grid-cols-2 gap-1.5">
     {revealOptions.map((option) => {
      const active = displayMode.revealMode === option.value;
      return (
       <Button
        key={option.value}
        variant={active ? "active" : "surfaceCard"}
        size="sm"
        aria-pressed={active}
        onClick={() => onChange({ revealMode: option.value })}
       >
        {option.label}
       </Button>
      );
     })}
    </div>
    {displayMode.revealMode === "tap" ? (
     <StudyInstructionText variant="caption" tone="muted" weight="medium" leading="relaxed">
      Mỗi lần bấm sẽ thay nội dung cùng một vị trí: Hán tự, Pinyin, nghĩa rồi quay lại.
     </StudyInstructionText>
    ) : null}
   </SettingsGroup>

   <SettingsGroup icon={<Eye />} label="Hiển thị">
    <div className="grid grid-cols-3 gap-1.5">
     {visibilityOptions.map((option) => {
      const active = displayMode[option.key];
      const disabled =
       displayMode.revealMode === "tap" &&
       (option.key === "showPinyin" || option.key === "showMeaning");
      return (
       <Button
        key={option.key}
        variant={active ? "active" : "surfaceCard"}
        size="sm"
        aria-pressed={active}
        disabled={disabled}
        onClick={() => onChange({ [option.key]: !active })}
       >
        <StudyInstructionText as="span" clamp="one">
         {option.label}
        </StudyInstructionText>
       </Button>
      );
     })}
    </div>
   </SettingsGroup>
  </div>
 );
}

function SettingsGroup({
 icon,
 label,
 children,
}: {
 icon: React.ReactNode;
 label: string;
 children: React.ReactNode;
}) {
 return (
  <section className="grid gap-1.5 rounded-lg border border-border-default bg-bg-subtle p-2">
   <Typography
    as="h3"
    variant="cardTitle"
    tone="muted"
    weight="black"
    transform="uppercase"
    className="flex items-center gap-1.5 [&_svg]:size-3.5"
   >
    {icon}
    {label}
   </Typography>
   {children}
  </section>
 );
}
