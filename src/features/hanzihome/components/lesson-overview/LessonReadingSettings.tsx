"use client";

import { Eye, Type } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

import {
 HanziFontPreview,
 HanziText,
 ReaderHanziText,
 StudyInstructionText,
} from "./hanzi-typography";
import { ProgressiveStudyText } from "./ProgressiveStudyText";
import type { HanziReaderFont, HanziReaderSize, LessonDisplayMode } from "./types";

export const fontOptions: Array<{ value: HanziReaderFont; label: string }> = [
 { value: "system", label: "Hệ thống" },
 { value: "songti", label: "Noto Serif SC" },
 { value: "noto-sans", label: "Noto Sans SC" },
 { value: "pinyin", label: "Pinyin" },
 { value: "kaiti", label: "Khải thư · 楷体" },
 { value: "fangsong", label: "Phỏng Tống · 仿宋" },
 { value: "ma-shan", label: "Ma Shan Zheng" },
 { value: "xiaowei", label: "ZCOOL XiaoWei" },
];

export const sizeOptions: Array<{
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

export const visibilityOptions: Array<{
 key: z.infer<typeof LessonReadingVisibilityKeySchema>;
 label: string;
 description: string;
}> = [
 {
  key: LessonReadingVisibilityKeySchema.enum.showPinyin,
  label: "Pinyin",
  description: "Hiện phiên âm dưới câu tiếng Trung.",
 },
 {
  key: "showMeaning",
  label: "Nghĩa",
  description: "Hiện bản dịch tiếng Việt khi đọc.",
 },
 {
  key: "showAnswers",
  label: "Đáp án",
  description: "Hiện đáp án ở các phần bài tập có hỗ trợ.",
 },
];

export const revealOptions: Array<{
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
  <div
   className={cn(
    "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] xl:items-start",
    className,
   )}
  >
   <Card variant="section" padding="lg">
    <SettingsGroup icon={<Type />} label="Kiểu chữ">
     <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {fontOptions.map((option) => {
       const active = displayMode.hanziFont === option.value;
       return (
        <Button
         key={option.value}
         variant={active ? "active" : "surfaceCard"}
         size="toolbar"
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

    <Separator className="my-5" />

    <SettingsGroup icon={<Type />} label="Cỡ chữ">
     <SegmentedControl<HanziReaderSize>
      value={displayMode.hanziSize}
      items={sizeOptions.map((option) => ({
       key: option.value,
       label: option.label,
      }))}
      onChange={(hanziSize) => onChange({ hanziSize })}
      density="touch"
      aria-label="Cỡ chữ Hán"
     />
    </SettingsGroup>

    <Separator className="my-5" />

    <SettingsGroup icon={<Eye />} label="Cách mở nội dung">
     <SegmentedControl<LessonDisplayMode["revealMode"]>
      value={displayMode.revealMode}
      items={revealOptions.map((option) => ({
       key: option.value,
       label: option.label,
      }))}
      onChange={(revealMode) => onChange({ revealMode })}
      density="touch"
      aria-label="Cách mở nội dung"
     />
     {displayMode.revealMode === "tap" ? (
      <StudyInstructionText variant="caption" tone="muted" weight="medium" leading="relaxed">
       Bấm trực tiếp vào câu để chuyển lần lượt Hán tự → Pinyin → nghĩa. Xem trước bên cạnh cũng hoạt động như nội dung thật.
      </StudyInstructionText>
     ) : null}
    </SettingsGroup>

    <Separator className="my-5" />

    <SettingsGroup icon={<Eye />} label="Hiển thị">
     <div className="divide-y divide-border-default">
      {visibilityOptions.map((option) => {
       const active = displayMode[option.key];
       const disabled =
        displayMode.revealMode === "tap" &&
        (option.key === "showPinyin" || option.key === "showMeaning");

       return (
        <div key={option.key} className="flex min-h-14 items-center justify-between gap-4 py-2.5">
         <div className="min-w-0">
          <Typography as="p" variant="label" tone="default" weight="bold">
           {option.label}
          </Typography>
          <Typography as="p" variant="caption" tone="muted" className="mt-0.5">
           {disabled ? "Được điều khiển bằng chế độ Bấm để mở." : option.description}
          </Typography>
         </div>
         <Switch
          checked={active}
          disabled={disabled}
          onCheckedChange={(checked) => onChange({ [option.key]: checked })}
          aria-label={`${active ? "Ẩn" : "Hiện"} ${option.label}`}
         />
        </div>
       );
      })}
     </div>
    </SettingsGroup>
   </Card>

   <ReadingSettingsPreview displayMode={displayMode} />
  </div>
 );
}

function ReadingSettingsPreview({ displayMode }: { displayMode: LessonDisplayMode }) {
 return (
  <Card variant="section" padding="lg" className="xl:sticky xl:top-4">
   <div className="flex items-start justify-between gap-3">
    <div>
     <Typography as="h3" variant="sectionTitle" tone="default" weight="black">
      Xem trước
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" className="mt-1">
      Đây là cách nội dung học sẽ hiển thị với thiết lập hiện tại.
     </Typography>
    </div>
    <HanziText
     as="span"
     displayMode={displayMode}
     size="medium"
     leading="none"
     tone="accent"
    >
     文
    </HanziText>
   </div>

   <div className="mt-5">
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     Bài đọc
    </StudyInstructionText>
    <div className="mt-3">
     <ProgressiveStudyText
      key={displayMode.revealMode}
      zh="开始自己安排时间以后，我才发现，学得久比一时学得快更重要。"
      pinyin="Kāishǐ zìjǐ ānpái shíjiān yǐhòu, wǒ cái fāxiàn, xué de jiǔ bǐ yìshí xué de kuài gèng zhòngyào."
      vi="Sau khi bắt đầu tự sắp xếp thời gian, tôi mới nhận ra học bền lâu quan trọng hơn việc chỉ học nhanh trong chốc lát."
      displayMode={displayMode}
     />
    </div>
   </div>

   <Separator className="my-5" />

   <div>
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     Bài tập
    </StudyInstructionText>
    <StudyInstructionText as="p" tone="secondary" className="mt-2">
     Hoàn thành câu với cấu trúc phù hợp:
    </StudyInstructionText>
    <ReaderHanziText displayMode={displayMode} size="lg" className="mt-2 block">
     我___开始自己安排时间，___发现每天复习一点更有效。
    </ReaderHanziText>
    {displayMode.showAnswers ? (
     <StudyInstructionText as="p" tone="success" weight="bold" className="mt-2">
      Đáp án hiển thị: 是从…以后才…
     </StudyInstructionText>
    ) : (
     <StudyInstructionText as="p" variant="caption" tone="muted" className="mt-2">
      Đáp án đang ẩn theo thiết lập hiện tại.
     </StudyInstructionText>
    )}
   </div>
  </Card>
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
  <section className="grid gap-3">
   <div className="flex items-center gap-2">
    <span aria-hidden="true" className="text-text-muted">
     {icon}
    </span>
    <Typography as="h3" variant="cardTitle" tone="muted" weight="black" transform="uppercase">
     {label}
    </Typography>
   </div>
   {children}
  </section>
 );
}
