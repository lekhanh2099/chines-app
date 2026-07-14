"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react";
import { SlidersHorizontal } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { LessonViewModeToggle } from "@/features/hanzihome/components/layout/LessonViewModeToggle";
import {
 contentEditingEnabled,
 developerToolsEnabled,
} from "@/features/hanzihome/context/workspaceLayout";
import { HanziHomeEditingDialogShell, HanziHomeEditingTools } from "@/features/hanzihome/editing";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import { cn } from "@/lib/utils";
import { HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID } from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";

export function HanziHomeDeveloperTools({
 inline = false,
 compact = false,
}: {
 inline?: boolean;
 compact?: boolean;
}) {
 const [toolsOpen, setToolsOpen] = useState(false);
 const canEdit = useHanziHomeCanEdit();
 const editMode = useHanziHomeEditMode();
 const showEditingTools = contentEditingEnabled && canEdit;

 if (!developerToolsEnabled && !showEditingTools) return null;

 if (compact) {
  return (
   <HanziHomeCompactDeveloperTools
    toolsOpen={toolsOpen}
    setToolsOpen={setToolsOpen}
    editMode={editMode}
    showEditingTools={showEditingTools}
   />
  );
 }

 if (inline) {
  return (
   <>
    {showEditingTools ? <HanziHomeEditingDialogShell /> : null}
    <div className="xl:hidden">
     <HanziHomeCompactDeveloperTools
      toolsOpen={toolsOpen}
      setToolsOpen={setToolsOpen}
      editMode={editMode}
      showEditingTools={showEditingTools}
      includeDialogShell={false}
     />
    </div>
    <div className="hidden items-center gap-2 xl:flex">
     {developerToolsEnabled ? <LessonViewModeToggle /> : null}
     {showEditingTools ? <HanziHomeEditingTools includeDialogShell={false} /> : null}
    </div>
   </>
  );
 }

 return (
  <div className="flex items-center justify-end gap-2 rounded-lg border border-dashed border-border-default bg-bg-subtle p-1.5">
   {developerToolsEnabled ? <LessonViewModeToggle /> : null}
   {showEditingTools ? <HanziHomeEditingTools /> : null}
  </div>
 );
}

function HanziHomeCompactDeveloperTools({
 toolsOpen,
 setToolsOpen,
 editMode,
 showEditingTools,
 includeDialogShell = true,
}: {
 toolsOpen: boolean;
 setToolsOpen: (open: boolean) => void;
 editMode: boolean;
 showEditingTools: boolean;
 includeDialogShell?: boolean;
}) {
 return (
  <>
   {showEditingTools && includeDialogShell ? <HanziHomeEditingDialogShell /> : null}
   <Popover.Root open={toolsOpen} onOpenChange={setToolsOpen} modal={false}>
    <Popover.Trigger
     className={cn(
      buttonVariants({ variant: editMode ? "active" : "outline", size: "icon-sm" }),
      "h-9 min-h-9 shrink-0 text-sm sm:w-auto sm:px-2.5",
     )}
    >
     <SlidersHorizontal className="h-4 w-4" />
     <span className="hidden sm:inline">{editMode ? "Đang sửa" : "Công cụ"}</span>
    </Popover.Trigger>
    <Popover.Portal>
     <Popover.Positioner
      side="bottom"
      align="end"
      sideOffset={8}
      collisionPadding={8}
      positionMethod="fixed"
      style={{ zIndex: 90 }}
     >
      <Popover.Popup
       initialFocus={false}
       finalFocus={false}
       className="w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-border-default bg-bg-elevated p-2 text-sm shadow-theme-lg"
      >
       <div
        id={HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID}
        className="grid gap-2 empty:hidden"
       />
       {developerToolsEnabled ? (
        <section className="mt-2 grid gap-1 border-t border-border-default pt-2 first:mt-0 first:border-t-0 first:pt-0">
         <p className="px-1 py-1 text-xs font-black uppercase tracking-wide text-text-muted">
          Chế độ
         </p>
         <LessonViewModeToggle />
        </section>
       ) : null}
       {showEditingTools ? (
        <section className="mt-2 grid gap-1 border-t border-border-default pt-2">
         <p className="px-1 py-1 text-xs font-black uppercase tracking-wide text-text-muted">
          Chỉnh sửa
         </p>
         <div className="flex flex-wrap items-center gap-2">
          <HanziHomeEditingTools includeDialogShell={false} />
         </div>
        </section>
       ) : null}
      </Popover.Popup>
     </Popover.Positioner>
    </Popover.Portal>
   </Popover.Root>
  </>
 );
}
