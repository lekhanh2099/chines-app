"use client";

import { Typography } from "@/components/ui/typography";
import { Eye, Settings2, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
 DialogBody,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
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

const sizeOptions: Array<{ value: HanziReaderSize; label: string; sample: string }> = [
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

type LessonReadingSettingsProps = {
 displayMode: LessonDisplayMode;
 onChange: (updates: Partial<LessonDisplayMode>) => void;
 className?: string;
};

export function LessonReadingSettingsDialogContent({
 displayMode,
 isLoading = false,
 onChange,
}: LessonReadingSettingsProps & { isLoading?: boolean }) {
 return (
  <DialogContent>
   <DialogHeader>
    <DialogTitle icon={<Settings2 />}>Thiết lập đọc</DialogTitle>
    <DialogDescription>Điều chỉnh cách hiển thị nội dung tiếng Trung.</DialogDescription>
   </DialogHeader>
   <DialogBody>
    {isLoading ? (
     <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-text-muted">
      <Spinner />
      Đang tải cài đặt đọc…
     </div>
    ) : (
     <LessonReadingSettings displayMode={displayMode} onChange={onChange} />
    )}
   </DialogBody>
   <DialogFooter>
    <DialogClose asChild>
     <Button type="button" variant="default" size="sm">
      Xong
     </Button>
    </DialogClose>
   </DialogFooter>
  </DialogContent>
 );
}

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
     <Button
      variant={displayMode.revealMode === "always" ? "active" : "surfaceCard"}
      size="sm"
      aria-pressed={displayMode.revealMode === "always"}
      onClick={() => onChange({ revealMode: "always" })}
     >
      Hiện sẵn
     </Button>
     <Button
      variant={displayMode.revealMode === "tap" ? "active" : "surfaceCard"}
      size="sm"
      aria-pressed={displayMode.revealMode === "tap"}
      onClick={() => onChange({ revealMode: "tap" })}
     >
      Bấm để mở
     </Button>
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
