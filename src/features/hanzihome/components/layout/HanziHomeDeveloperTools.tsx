"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
 BasePopoverTrigger,
} from "@/components/ui/base-popover";
import { LessonViewModeToggle } from "@/features/hanzihome/components/layout/LessonViewModeToggle";
import {
 contentEditingEnabled,
 developerToolsEnabled,
} from "@/features/hanzihome/context/workspaceLayout";
import { HanziHomeEditingDialogShell, HanziHomeEditingTools } from "@/features/hanzihome/editing";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import { HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID } from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";

export function HanziHomeDeveloperTools({
 inline = false,
 compact = false,
 children,
}: {
 inline?: boolean;
 compact?: boolean;
 children?: ReactNode;
}) {
 const [toolsOpen, setToolsOpen] = useState(false);
 const canEdit = useHanziHomeCanEdit();
 const editMode = useHanziHomeEditMode();
 const showEditingTools = contentEditingEnabled && canEdit;

 if (!developerToolsEnabled && !showEditingTools && !children) return null;

 if (compact) {
  return (
   <HanziHomeCompactDeveloperTools
    toolsOpen={toolsOpen}
    setToolsOpen={setToolsOpen}
    editMode={editMode}
    showEditingTools={showEditingTools}
   >
    {children}
   </HanziHomeCompactDeveloperTools>
  );
 }

 if (inline) {
  return (
   <>
    {showEditingTools ? <HanziHomeEditingDialogShell /> : null}
    <HanziHomeCompactDeveloperTools
     toolsOpen={toolsOpen}
     setToolsOpen={setToolsOpen}
     editMode={editMode}
     showEditingTools={showEditingTools}
     includeDialogShell={false}
    >
     {children}
    </HanziHomeCompactDeveloperTools>
   </>
  );
 }

 return (
  <HanziHomeCompactDeveloperTools
   toolsOpen={toolsOpen}
   setToolsOpen={setToolsOpen}
   editMode={editMode}
   showEditingTools={showEditingTools}
  >
   {children}
  </HanziHomeCompactDeveloperTools>
 );
}

function HanziHomeCompactDeveloperTools({
 toolsOpen,
 setToolsOpen,
 editMode,
 showEditingTools,
 includeDialogShell = true,
 children,
}: {
 toolsOpen: boolean;
 setToolsOpen: (open: boolean) => void;
 editMode: boolean;
 showEditingTools: boolean;
 includeDialogShell?: boolean;
 children?: ReactNode;
}) {
 return (
  <>
   {showEditingTools && includeDialogShell ? <HanziHomeEditingDialogShell /> : null}
   <Popover.Root open={toolsOpen} onOpenChange={setToolsOpen} modal={false}>
    <BasePopoverTrigger active={editMode} aria-label="Mở công cụ bài học">
     <SlidersHorizontal className="h-4 w-4" />
     Công cụ
    </BasePopoverTrigger>
    <Popover.Portal>
     <BasePopoverPositioner
      side="bottom"
      align="end"
      sideOffset={8}
      collisionPadding={8}
      positionMethod="fixed"
     >
      <BasePopoverPopup variant="menu" initialFocus={false} finalFocus={false}>
       {developerToolsEnabled ? (
        <section className="grid gap-1">
         <StudyInstructionText
          variant="overline"
          tone="muted"
          weight="black"
          tracking="wide"
          transform="uppercase"
          className="px-1 py-1"
         >
          Chế độ xem
         </StudyInstructionText>
         <LessonViewModeToggle presentation="menu" />
        </section>
       ) : null}
       {children ? (
        <section className="grid gap-1 border-t border-border-default pt-2 first:border-t-0 first:pt-0">
         <StudyInstructionText
          variant="overline"
          tone="muted"
          weight="black"
          tracking="wide"
          transform="uppercase"
          className="px-1 py-1"
         >
          Không gian học
         </StudyInstructionText>
         <div id={HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID} className="grid gap-1">
          {children}
         </div>
        </section>
       ) : null}
       {showEditingTools ? (
        <section className="grid gap-1 border-t border-border-default pt-2 first:border-t-0 first:pt-0">
         <StudyInstructionText
          variant="overline"
          tone="muted"
          weight="black"
          tracking="wide"
          transform="uppercase"
          className="px-1 py-1"
         >
          Chỉnh sửa nội dung
         </StudyInstructionText>
         <div className="grid gap-1">
          <HanziHomeEditingTools includeDialogShell={false} presentation="menu" />
         </div>
        </section>
       ) : null}
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </Popover.Portal>
   </Popover.Root>
  </>
 );
}
