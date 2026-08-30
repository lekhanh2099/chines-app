"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { ReadingSettingsTouchControls } from "@/features/hanzihome/components/reading/ReadingSettingsTouchControls";

export function HanziHomeReadOnlyReadingSettingsTrigger({
 displayMode,
 onDisplayModeChange,
}: {
 displayMode: LessonDisplayMode;
 onDisplayModeChange: (updates: Partial<LessonDisplayMode>) => void;
}) {
 const [sheetOpen, setSheetOpen] = useState(false);

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
    <SheetBody className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
     <ReadingSettingsTouchControls displayMode={displayMode} onChange={onDisplayModeChange} />
    </SheetBody>
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
      <div className="p-3">
       <ReadingSettingsTouchControls displayMode={displayMode} onChange={onDisplayModeChange} />
      </div>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>
  </>
 );
}
