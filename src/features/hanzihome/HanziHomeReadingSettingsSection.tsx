"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { type ComponentProps, useRef } from "react";
import { LessonReadingSettings } from "@/features/hanzihome/components/lesson-overview/LessonReadingSettings";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { BookOpenCheck, CloudOff, RefreshCcw, X } from "lucide-react";

type ReaderQuickSettingsAnchor = ComponentProps<typeof BasePopoverPositioner>["anchor"];
type ReaderQuickSettingsFinalFocus = ComponentProps<typeof BasePopoverPopup>["finalFocus"];
type ReaderQuickSettingsCloseButtonRef = ComponentProps<typeof Button>["ref"];

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

export function HanziHomeReadingQuickSettingsPanel({
 open,
 onOpenChange,
 anchor,
 finalFocus,
}: {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 anchor: ReaderQuickSettingsAnchor;
 finalFocus: ReaderQuickSettingsFinalFocus;
}) {
 const closeButtonRef = useRef<HTMLButtonElement>(null);

 return (
  <Popover.Root open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)} modal="trap-focus">
   <Popover.Portal>
    <BasePopoverPositioner
     anchor={anchor}
     side="bottom"
     align="end"
     sideOffset={8}
     collisionPadding={8}
     positionMethod="fixed"
    >
     <BasePopoverPopup
      aria-label="Thiết lập đọc"
      initialFocus={closeButtonRef}
      finalFocus={finalFocus}
      variant="default"
     >
      {open ? <HanziHomeReadingQuickSettingsPanelContent closeButtonRef={closeButtonRef} /> : null}
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}

function HanziHomeReadingQuickSettingsPanelContent({
 closeButtonRef,
}: {
 closeButtonRef: ReaderQuickSettingsCloseButtonRef;
}) {
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;

 const updateDisplayMode = (updates: Partial<typeof displayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 return (
  <div className="grid max-h-[calc(100dvh-5rem)] w-96 max-w-full gap-3 overflow-y-auto p-3 scrollbar-soft">
   <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 space-y-0.5">
     <Typography as="h2" variant="cardTitle" tone="default" weight="black">
      <BookOpenCheck className="size-4 shrink-0" />
      Thiết lập đọc
     </Typography>
     <Typography as="p" variant="caption" tone="muted" weight="medium">
      Áp dụng ngay cho nội dung tiếng Trung.
     </Typography>
    </div>
    <div className="flex shrink-0 items-center gap-1.5">
     <Badge
      variant={learning.isError ? "warning" : learning.isSaving ? "info" : "success"}
      size="sm"
     >
      {learning.isError
       ? "Cần đồng bộ"
       : learning.isSaving
         ? "Đang lưu"
         : learning.isOnline
           ? "Đã đồng bộ"
           : "Cục bộ"}
     </Badge>
     <Popover.Close
      render={
       <Button
        ref={closeButtonRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Đóng thiết lập đọc"
       />
      }
     >
      <X />
     </Popover.Close>
    </div>
   </div>

   {learning.isLoading ? (
    <div className="flex min-h-36 items-center justify-center gap-2">
     <Spinner />
     <Typography variant="label" tone="muted" weight="bold">
      Đang tải cài đặt đọc…
     </Typography>
    </div>
   ) : (
    <div className="grid gap-3">
     {learning.isError ? (
      <Card
       variant="subtle"
       padding="md"
       className="flex flex-wrap items-center justify-between gap-3"
      >
       <Typography as="p" variant="bodySmall" tone="secondary" className="min-w-0 flex-1">
        <CloudOff className="size-4 shrink-0" />
        {learning.lastSyncError ||
         "Chưa thể đồng bộ cài đặt đọc. Các thay đổi cục bộ vẫn được giữ."}
       </Typography>
       <Button type="button" variant="outline" size="sm" onClick={() => void learning.retrySync()}>
        <RefreshCcw />
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
