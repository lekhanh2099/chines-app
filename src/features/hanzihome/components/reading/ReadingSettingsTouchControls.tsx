"use client";

import { Eye, Type, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { HanziFontPreview } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 fontOptions,
 revealOptions,
 sizeOptions,
 visibilityOptions,
} from "@/features/hanzihome/components/lesson-overview/LessonReadingSettings";
import type {
 HanziReaderSize,
 LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";

export function ReadingSettingsTouchControls({
 displayMode,
 onChange,
}: {
 displayMode: LessonDisplayMode;
 onChange: (updates: Partial<LessonDisplayMode>) => void;
}) {
 const t = useTranslations("Reader.study.chrome.tools");

 return (
  <div className="grid gap-5">
   <section className="grid gap-3">
    <SettingsGroupLabel icon={Type} label="Phông chữ" />
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
     {fontOptions.map((option) => {
      const active = displayMode.hanziFont === option.value;
      return (
       <Button
        key={option.value}
        type="button"
        variant={active ? "active" : "surfaceCard"}
        size="touch"
        aria-pressed={active}
        onClick={() => onChange({ hanziFont: option.value })}
       >
        <HanziFontPreview as="span" font={option.value} leading="none">
         文
        </HanziFontPreview>
        <span className="min-w-0 truncate">{option.label}</span>
       </Button>
      );
     })}
    </div>
   </section>

   <Separator />

   <section className="grid gap-3">
    <SettingsGroupLabel icon={Type} label="Cỡ chữ" />
    <SegmentedControl<HanziReaderSize>
     value={displayMode.hanziSize}
     items={sizeOptions.map((option) => ({ key: option.value, label: option.label }))}
     onChange={(hanziSize) => onChange({ hanziSize })}
     density="touch"
     aria-label="Cỡ chữ Hán"
    />
   </section>

   <Separator />

   <section className="grid gap-3">
    <SettingsGroupLabel icon={Eye} label="Cách mở nội dung" />
    <SegmentedControl<LessonDisplayMode["revealMode"]>
     value={displayMode.revealMode}
     items={revealOptions.map((option) => ({ key: option.value, label: option.label }))}
     onChange={(revealMode) => onChange({ revealMode })}
     density="touch"
     aria-label="Cách mở nội dung"
    />
   </section>

   <Separator />

   <section className="grid gap-2">
    <SettingsGroupLabel icon={Eye} label="Hiển thị" />
    <div className="divide-y divide-border-default">
     {visibilityOptions.map((option) => {
      const active = displayMode[option.key];
      const disabled =
       displayMode.revealMode === "tap" &&
       (option.key === "showPinyin" || option.key === "showMeaning");

      return (
       <div key={option.key} className="flex min-h-14 items-center justify-between gap-4 py-2.5">
        <div className="grid min-w-0 gap-0.5">
         <Typography as="p" variant="label" tone="default" weight="bold">
          {option.label}
         </Typography>
         <Typography as="p" variant="caption" tone="muted">
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
     <div className="flex min-h-14 items-center justify-between gap-4 py-2.5">
      <div className="grid min-w-0 gap-0.5">
       <Typography as="p" variant="label" tone="default" weight="bold">
        {t("autoPinyin")}
       </Typography>
       <Typography as="p" variant="caption" tone="muted">
        {t("autoPinyinDescription")}
       </Typography>
      </div>
      <Switch
       checked={displayMode.autoDetectPinyin}
       onCheckedChange={(checked) => onChange({ autoDetectPinyin: checked })}
       aria-label={t("autoPinyin")}
      />
     </div>
    </div>
   </section>
  </div>
 );
}

function SettingsGroupLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
 return (
  <div className="flex items-center gap-2">
   <Icon aria-hidden="true" className="size-4 text-text-muted" />
   <Typography as="h3" variant="cardTitle" tone="muted" weight="black" transform="uppercase">
    {label}
   </Typography>
  </div>
 );
}
