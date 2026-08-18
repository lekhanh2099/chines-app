"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { HanziHomeReadingQuickSettingsMenu } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { ReadingSettingsTouchControls } from "@/features/hanzihome/components/reading/ReadingSettingsTouchControls";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";

export function HanziHomeReadingSettingsTrigger() {
 const [sheetOpen, setSheetOpen] = useState(false);
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;

 const updateDisplayMode = (updates: Partial<typeof displayMode>) => {
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
       <ReadingSettingsTouchControls displayMode={displayMode} onChange={updateDisplayMode} />
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
