"use client";

import { LessonViewModeToggle } from "@/features/hanzihome/components/layout/LessonViewModeToggle";
import { developerToolsEnabled } from "@/features/hanzihome/context/workspaceLayout";
import { HanziHomeEditingTools } from "@/features/hanzihome/editing";

export function HanziHomeDeveloperTools({ inline = false }: { inline?: boolean }) {
 if (!developerToolsEnabled) return null;

 return (
  <div
   className={
    inline
     ? "hidden items-center gap-2 xl:flex"
     : "hidden items-center justify-end gap-2 rounded-lg border border-dashed border-border-default bg-bg-subtle p-1.5 xl:flex"
   }
  >
   <LessonViewModeToggle />
   <HanziHomeEditingTools />
  </div>
 );
}
