"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
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

   <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
    <DialogContent size="md" aria-describedby={undefined}>
     <DialogHeader>
      <DialogTitle>Thiết lập đọc</DialogTitle>
     </DialogHeader>
     <DialogBody>
      <ReadingSettingsTouchControls displayMode={displayMode} onChange={onDisplayModeChange} />
     </DialogBody>
    </DialogContent>
   </Dialog>

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
