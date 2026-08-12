"use client";

import Link from "next/link";
import { Eye, Settings2, Type, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { HanziHomeReadingQuickSettingsMenu } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
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
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";

export function HanziHomeReadingSettingsTrigger() {
 const [sheetOpen, setSheetOpen] = useState(false);
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;

 const updateDisplayMode = (updates: Partial<LessonDisplayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 return (
  <>
   <div className="xl:hidden">
    <Button
     type="button"
     variant="outline"
     size="icon-toolbar"
     aria-label="Thiết lập đọc"
     title="Thiết lập đọc"
     aria-haspopup="dialog"
     aria-expanded={sheetOpen}
     onClick={() => setSheetOpen(true)}
    >
     <Settings2 />
    </Button>
   </div>

   <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="bottom" height="tall">
    <SheetHeader title="Thiết lập đọc" onClose={() => setSheetOpen(false)} />
    <SheetBody className="pb-6">
     {learning.isLoading ? (
      <div className="flex min-h-40 items-center justify-center gap-2">
       <Spinner />
       <Typography variant="label" tone="muted" weight="bold">
        Đang tải cài đặt đọc…
       </Typography>
      </div>
     ) : (
      <div className="grid gap-4">
       {learning.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
         <Typography as="p" variant="bodySmall" tone="secondary" className="min-w-0 flex-1">
          {learning.lastSyncError ||
           "Chưa thể đồng bộ cài đặt đọc. Các thay đổi cục bộ vẫn được giữ."}
         </Typography>
         <Button
          type="button"
          variant="outline"
          size="toolbar"
          onClick={() => void learning.retrySync()}
         >
          Thử đồng bộ lại
         </Button>
        </div>
       ) : null}
       <ReadingSettingsSheetControls displayMode={displayMode} onChange={updateDisplayMode} />
      </div>
     )}
    </SheetBody>
    <SheetFooter className="pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
     <Button variant="outline" size="touch" asChild className="w-full sm:w-auto">
      <Link href="/settings?section=reading" onClick={() => setSheetOpen(false)}>
       <Settings2 data-icon="inline-start" />
       Mở cài đặt đọc đầy đủ
      </Link>
     </Button>
    </SheetFooter>
   </Sheet>

   <div className="hidden xl:block">
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button
       type="button"
       variant="outline"
       size="icon-toolbar"
       aria-label="Thiết lập đọc"
       title="Thiết lập đọc"
      >
       <Settings2 />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" width="lg">
      <HanziHomeReadingQuickSettingsMenu />
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
       <Link href="/settings?section=reading">
        <Settings2 />
        Mở cài đặt đọc đầy đủ
       </Link>
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>
  </>
 );
}

function ReadingSettingsSheetControls({
 displayMode,
 onChange,
}: {
 displayMode: LessonDisplayMode;
 onChange: (updates: Partial<LessonDisplayMode>) => void;
}) {
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
     items={sizeOptions.map((option) => ({
      key: option.value,
      label: option.label,
     }))}
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
     items={revealOptions.map((option) => ({
      key: option.value,
      label: option.label,
     }))}
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
