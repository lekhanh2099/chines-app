"use client";

import { Eye, Settings2, Type, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { getHanziFontFamily } from "./hanzi-typography";
import type { HanziReaderFont, HanziReaderSize, LessonDisplayMode } from "./types";

const fontOptions: Array<{ value: HanziReaderFont; label: string }> = [
 { value: "songti", label: "Songti" },
 { value: "kai", label: "Kai" },
 { value: "mengshen", label: "Mộng Thần" },
 { value: "pinyin", label: "Pinyin" },
 { value: "system", label: "Hệ thống" },
];

const sizeOptions: Array<{ value: HanziReaderSize; label: string; sample: string }> = [
 { value: "md", label: "Vừa", sample: "A" },
 { value: "lg", label: "Lớn", sample: "A" },
 { value: "xl", label: "Rất lớn", sample: "A" },
 { value: "2xl", label: "Siêu lớn", sample: "A" },
 { value: "3xl", label: "Cực lớn", sample: "A" },
];

const visibilityOptions: Array<{
 key: "showPinyin" | "showMeaning" | "showAnswers";
 label: string;
}> = [
 { key: "showPinyin", label: "Pinyin" },
 { key: "showMeaning", label: "Nghĩa" },
 { key: "showAnswers", label: "Đáp án" },
];

type LessonReadingSettingsProps = {
 displayMode: LessonDisplayMode;
 onChange: (updates: Partial<LessonDisplayMode>) => void;
 className?: string;
};

export function LessonReadingSettingsDialog({
 displayMode,
 onChange,
 triggerClassName,
}: LessonReadingSettingsProps & { triggerClassName?: string }) {
 return (
  <Dialog>
   <DialogTrigger asChild>
    <Button type="button" variant="outline" size="sm" className={triggerClassName}>
     <Settings2 />
     <span className="hidden sm:inline">Cài đặt đọc</span>
    </Button>
   </DialogTrigger>
   <DialogContent
    className="flex max-h-[min(46rem,calc(100dvh-1rem))] max-w-xl flex-col gap-0 overflow-hidden p-0"
    showCloseButton={false}
   >
    <DialogHeader className="shrink-0 border-b border-border-default bg-bg-subtle px-4 py-3 pr-4 sm:px-5 sm:py-4">
     <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
       <DialogTitle className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
         <Settings2 className="size-4" />
        </span>
        Thiết lập đọc
       </DialogTitle>
       <DialogDescription className="mt-1">
        Điều chỉnh cách hiển thị nội dung tiếng Trung.
       </DialogDescription>
      </div>
      <DialogClose asChild>
       <Button type="button" variant="ghost" size="icon-sm" aria-label="Đóng thiết lập đọc">
        <X />
       </Button>
      </DialogClose>
     </div>
    </DialogHeader>
    <DialogBody className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-soft sm:p-4">
     <LessonReadingSettings displayMode={displayMode} onChange={onChange} />
    </DialogBody>
    <DialogFooter className="shrink-0 border-t border-border-default px-3 py-2.5 sm:px-4">
     <DialogClose asChild>
      <Button type="button" variant="default" size="sm">
       Xong
      </Button>
     </DialogClose>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

export function LessonReadingSettings({
 displayMode,
 onChange,
 className,
}: LessonReadingSettingsProps) {
 return (
  <div className={cn("grid min-w-0 gap-2.5", className)}>
   <SettingsGroup icon={<Type />} label="Kiểu chữ">
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
     {fontOptions.map((option) => {
      const active = displayMode.hanziFont === option.value;
      return (
       <Button
        key={option.value}
        variant={active ? "active" : "surfaceCard"}
        size="sm"
        className="min-w-0 justify-start px-2"
        aria-pressed={active}
        onClick={() => onChange({ hanziFont: option.value })}
       >
        <span
         lang="zh-CN"
         className="text-base leading-none"
         style={{ fontFamily: getHanziFontFamily(option.value) }}
        >
         文
        </span>
        <span className="truncate">{option.label}</span>
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
        className="h-auto min-w-0 flex-col gap-0.5 py-1.5 whitespace-normal"
        aria-pressed={active}
        onClick={() => onChange({ hanziSize: option.value })}
       >
        <span
         className={cn("leading-none", index < 2 ? "text-sm" : index < 4 ? "text-base" : "text-lg")}
        >
         {option.sample}
        </span>
        <span className="text-[0.65rem] leading-tight">{option.label}</span>
       </Button>
      );
     })}
    </div>
   </SettingsGroup>

   <SettingsGroup icon={<Eye />} label="Hiển thị">
    <div className="grid grid-cols-3 gap-1.5">
     {visibilityOptions.map((option) => {
      const active = displayMode[option.key];
      return (
       <Button
        key={option.key}
        variant={active ? "active" : "surfaceCard"}
        size="sm"
        className="min-w-0 px-1.5"
        aria-pressed={active}
        onClick={() => onChange({ [option.key]: !active })}
       >
        <span className="truncate">{option.label}</span>
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
  <section className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-2.5">
   <h3 className="flex items-center gap-1.5 text-xs font-black uppercase text-text-muted [&_svg]:size-3.5">
    {icon}
    {label}
   </h3>
   {children}
  </section>
 );
}
