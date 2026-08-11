"use client";

import Link from "next/link";
import { Eye, RefreshCcw, Settings2, Type } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { HanziFontPreview } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 LessonReadingSettings,
 fontOptions,
 revealOptions,
 sizeOptions,
 visibilityOptions,
} from "@/features/hanzihome/components/lesson-overview/LessonReadingSettings";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";

export function HanziHomeReadingSettingsSection() {
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;

 const updateDisplayMode = (updates: Partial<typeof displayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 return (
  <div className="grid gap-4">
   <Card
    variant="section"
    padding="lg"
    className="flex flex-wrap items-start justify-between gap-3"
   >
    <div className="min-w-0 space-y-1">
     <Typography as="h2" variant="sectionTitle" tone="default" weight="bold">
      Thiết lập đọc
     </Typography>
     <Typography as="p" tone="secondary" leading="standard" className="max-w-3xl">
      Điều chỉnh font, cỡ chữ, pinyin, nghĩa và đáp án cho nội dung tiếng Trung.
     </Typography>
    </div>
    <Badge
     variant={learning.isError ? "warning" : learning.isSaving ? "info" : "success"}
     size="md"
    >
     {learning.isError
      ? "Cần đồng bộ lại"
      : learning.isSaving
        ? "Đang đồng bộ"
        : learning.isOnline
          ? "Đã đồng bộ"
          : "Lưu cục bộ"}
    </Badge>
   </Card>

   {learning.isLoading ? (
    <Card
     variant="section"
     padding="lg"
     className="flex min-h-48 items-center justify-center gap-2"
    >
     <Spinner />
     <Typography variant="label" tone="muted" weight="bold">
      Đang tải cài đặt đọc…
     </Typography>
    </Card>
   ) : (
    <div className="grid gap-3">
     {learning.isError ? (
      <Card
       variant="subtle"
       padding="md"
       className="flex flex-wrap items-center justify-between gap-3"
      >
       <Typography as="p" variant="bodySmall" tone="secondary" className="min-w-0 flex-1">
        {learning.lastSyncError ||
         "Chưa thể đồng bộ cài đặt đọc. Các thay đổi cục bộ vẫn được giữ."}
       </Typography>
       <Button type="button" variant="outline" size="toolbar" onClick={() => void learning.retrySync()}>
        Thử đồng bộ lại
       </Button>
      </Card>
     ) : null}
     <LessonReadingSettings displayMode={displayMode} onChange={updateDisplayMode} />
    </div>
   )}
  </div>
 );
}

export function HanziHomeReadingQuickSettingsButton() {
 return (
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
 );
}

export function HanziHomeReadingQuickSettingsMenu() {
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;

 const updateDisplayMode = (updates: Partial<typeof displayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 return (
  <>
   <DropdownMenuLabel>Thiết lập đọc</DropdownMenuLabel>
   {learning.isLoading ? (
    <DropdownMenuItem disabled>
     <Spinner />
     Đang tải cài đặt đọc…
    </DropdownMenuItem>
   ) : (
    <>
     <DropdownMenuSub>
      <DropdownMenuSubTrigger>
       <Type />
       Phông chữ
       <Typography as="span" variant="caption" tone="muted" className="max-w-28" clamp="one">
        {fontOptions.find((option) => option.value === displayMode.hanziFont)?.label}
       </Typography>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent width="lg">
       <DropdownMenuLabel>Phông chữ</DropdownMenuLabel>
       <DropdownMenuRadioGroup
        value={displayMode.hanziFont}
        onValueChange={(value) => {
         const option = fontOptions.find((candidate) => candidate.value === value);
         if (option) updateDisplayMode({ hanziFont: option.value });
        }}
       >
        {fontOptions.map((option) => (
         <DropdownMenuRadioItem
          key={option.value}
          value={option.value}
          onSelect={(event) => event.preventDefault()}
         >
          <HanziFontPreview as="span" font={option.value} leading="none">
           文
          </HanziFontPreview>
          {option.label}
         </DropdownMenuRadioItem>
        ))}
       </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
     </DropdownMenuSub>

     <DropdownMenuSub>
      <DropdownMenuSubTrigger>
       <Type />
       Cỡ chữ
       <Typography as="span" variant="caption" tone="muted">
        {sizeOptions.find((option) => option.value === displayMode.hanziSize)?.label}
       </Typography>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent width="md">
       <DropdownMenuLabel>Cỡ chữ</DropdownMenuLabel>
       <DropdownMenuRadioGroup
        value={displayMode.hanziSize}
        onValueChange={(value) => {
         const option = sizeOptions.find((candidate) => candidate.value === value);
         if (option) updateDisplayMode({ hanziSize: option.value });
        }}
       >
        {sizeOptions.map((option) => (
         <DropdownMenuRadioItem
          key={option.value}
          value={option.value}
          onSelect={(event) => event.preventDefault()}
         >
          {option.label}
         </DropdownMenuRadioItem>
        ))}
       </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
     </DropdownMenuSub>

     <DropdownMenuSeparator />
     <DropdownMenuLabel>Hiển thị</DropdownMenuLabel>

     <DropdownMenuSub>
      <DropdownMenuSubTrigger>
       <Eye />
       Cách mở nội dung
       <Typography as="span" variant="caption" tone="muted">
        {revealOptions.find((option) => option.value === displayMode.revealMode)?.label}
       </Typography>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent width="md">
       <DropdownMenuLabel>Cách mở nội dung</DropdownMenuLabel>
       <DropdownMenuRadioGroup
        value={displayMode.revealMode}
        onValueChange={(value) => {
         const option = revealOptions.find((candidate) => candidate.value === value);
         if (option) updateDisplayMode({ revealMode: option.value });
        }}
       >
        {revealOptions.map((option) => (
         <DropdownMenuRadioItem
          key={option.value}
          value={option.value}
          onSelect={(event) => event.preventDefault()}
         >
          {option.label}
         </DropdownMenuRadioItem>
        ))}
       </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
     </DropdownMenuSub>

     <DropdownMenuSub>
      <DropdownMenuSubTrigger>
       <Eye />
       Hiển thị lớp học
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent width="md">
       <DropdownMenuLabel>Hiển thị lớp học</DropdownMenuLabel>
       {visibilityOptions.map((option) => (
        <DropdownMenuCheckboxItem
         key={option.key}
         checked={displayMode[option.key]}
         disabled={
          displayMode.revealMode === "tap" &&
          (option.key === "showPinyin" || option.key === "showMeaning")
         }
         onSelect={(event) => event.preventDefault()}
         onCheckedChange={(checked) => updateDisplayMode({ [option.key]: checked })}
        >
         {option.label}
        </DropdownMenuCheckboxItem>
       ))}
      </DropdownMenuSubContent>
     </DropdownMenuSub>
    </>
   )}

   {learning.isError ? (
    <>
     <DropdownMenuSeparator />
     <DropdownMenuItem onSelect={() => void learning.retrySync()}>
      <RefreshCcw />
      Thử đồng bộ lại
     </DropdownMenuItem>
    </>
   ) : null}
  </>
 );
}
