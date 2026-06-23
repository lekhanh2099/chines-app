"use client";

import { LessonViewModeToggle } from "@/features/hanzihome/components/layout/LessonViewModeToggle";
import {
 contentEditingEnabled,
 developerToolsEnabled,
} from "@/features/hanzihome/context/workspaceLayout";
import { HanziHomeEditingTools } from "@/features/hanzihome/editing";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";

export function HanziHomeDeveloperTools({ inline = false }: { inline?: boolean }) {
 const canEdit = useHanziHomeCanEdit();
 const showEditingTools = contentEditingEnabled && canEdit;

 if (!developerToolsEnabled && !showEditingTools) return null;

 return (
  <div
   className={
    inline
     ? "flex items-center gap-2"
     : "flex items-center justify-end gap-2 rounded-lg border border-dashed border-border-default bg-bg-subtle p-1.5"
   }
  >
   {developerToolsEnabled ? <LessonViewModeToggle /> : null}
   {showEditingTools ? <HanziHomeEditingTools /> : null}
  </div>
 );
}
