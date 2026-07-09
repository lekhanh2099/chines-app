"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { LessonViewModeToggle } from "@/features/hanzihome/components/layout/LessonViewModeToggle";
import {
 contentEditingEnabled,
 developerToolsEnabled,
} from "@/features/hanzihome/context/workspaceLayout";
import { HanziHomeEditingDialogShell, HanziHomeEditingTools } from "@/features/hanzihome/editing";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";

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
    <div className="xl:hidden">
     <HanziHomeCompactDeveloperTools
      toolsOpen={toolsOpen}
      setToolsOpen={setToolsOpen}
      editMode={editMode}
      showEditingTools={showEditingTools}
     />
    </div>
    <div className="hidden items-center gap-2 xl:flex">
     {developerToolsEnabled ? <LessonViewModeToggle /> : null}
     {showEditingTools ? <HanziHomeEditingTools /> : null}
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
}: {
 toolsOpen: boolean;
 setToolsOpen: (open: boolean) => void;
 editMode: boolean;
 showEditingTools: boolean;
}) {
 return (
  <>
    {showEditingTools ? <HanziHomeEditingDialogShell /> : null}
    <Button
     type="button"
     variant={editMode ? "active" : "outline"}
     size="sm"
     className="h-8 shrink-0 px-2.5 text-xs"
     onClick={() => setToolsOpen(true)}
    >
     <SlidersHorizontal className="h-4 w-4" />
     {editMode ? "Đang sửa" : "Công cụ"}
    </Button>
    <Sheet open={toolsOpen} onOpenChange={setToolsOpen} side="bottom" className="p-4">
     <SheetHeader title="Công cụ bài học" onClose={() => setToolsOpen(false)} />
     <div className="grid gap-4">
      {developerToolsEnabled ? (
       <section className="grid gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">Chế độ</p>
        <LessonViewModeToggle />
       </section>
      ) : null}
      {showEditingTools ? (
       <section className="grid gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">Chỉnh sửa</p>
        <div className="flex flex-wrap items-center gap-2">
         <HanziHomeEditingTools includeDialogShell={false} />
        </div>
       </section>
      ) : null}
     </div>
    </Sheet>
  </>
 );
}
