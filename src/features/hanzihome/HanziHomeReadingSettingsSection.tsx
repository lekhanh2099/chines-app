"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 DropdownMenuCheckboxItem,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuShortcut,
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
import { ChevronLeft, Eye, RefreshCcw, Type } from "lucide-react";
import { z } from "zod";

export const HanziHomeReadingQuickSettingsSectionSchema = z.enum([
 "font",
 "size",
 "reveal",
 "visibility",
]);

export const HanziHomeReadingQuickSettingsActiveSectionSchema = z.nullable(
 HanziHomeReadingQuickSettingsSectionSchema,
);

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
       <Button type="button" variant="outline" size="sm" onClick={() => void learning.retrySync()}>
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

export function HanziHomeReadingQuickSettingsMenu({
 activeSection,
 onActiveSectionChange,
}: {
 activeSection: z.infer<typeof HanziHomeReadingQuickSettingsActiveSectionSchema>;
 onActiveSectionChange: (
  section: z.infer<typeof HanziHomeReadingQuickSettingsActiveSectionSchema>,
 ) => void;
}) {
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;

 const updateDisplayMode = (updates: Partial<typeof displayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 if (activeSection) {
  return (
   <>
    <DropdownMenuItem
     onSelect={(event) => {
      event.preventDefault();
      onActiveSectionChange(null);
     }}
    >
     <ChevronLeft />
     Quay lại cài đặt nhanh
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>
     {activeSection === "font"
      ? "Phông chữ"
      : activeSection === "size"
        ? "Cỡ chữ"
        : activeSection === "reveal"
          ? "Cách mở nội dung"
          : "Hiển thị"}
    </DropdownMenuLabel>
    {activeSection === "font" ? (
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
    ) : null}
    {activeSection === "size" ? (
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
    ) : null}
    {activeSection === "reveal" ? (
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
    ) : null}
    {activeSection === "visibility"
     ? visibilityOptions.map((option) => (
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
       ))
     : null}
   </>
  );
 }

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
     <DropdownMenuItem
      onSelect={(event) => {
       event.preventDefault();
       onActiveSectionChange("font");
      }}
     >
      <Type />
      Phông chữ
      <DropdownMenuShortcut>
       {fontOptions.find((option) => option.value === displayMode.hanziFont)?.label}
      </DropdownMenuShortcut>
     </DropdownMenuItem>
     <DropdownMenuItem
      onSelect={(event) => {
       event.preventDefault();
       onActiveSectionChange("size");
      }}
     >
      <Type />
      Cỡ chữ
      <DropdownMenuShortcut>
       {sizeOptions.find((option) => option.value === displayMode.hanziSize)?.label}
      </DropdownMenuShortcut>
     </DropdownMenuItem>
     <DropdownMenuSeparator />
     <DropdownMenuLabel>Hiển thị</DropdownMenuLabel>
     <DropdownMenuItem
      onSelect={(event) => {
       event.preventDefault();
       onActiveSectionChange("reveal");
      }}
     >
      <Eye />
      Cách mở nội dung
      <DropdownMenuShortcut>
       {revealOptions.find((option) => option.value === displayMode.revealMode)?.label}
      </DropdownMenuShortcut>
     </DropdownMenuItem>
     <DropdownMenuItem
      onSelect={(event) => {
       event.preventDefault();
       onActiveSectionChange("visibility");
      }}
     >
      <Eye />
      Hiển thị
     </DropdownMenuItem>
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
