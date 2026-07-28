"use client";

import { Bug, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import type { EditingToolsPresentation, LessonViewMode } from "@/features/hanzihome/context/types";

const lessonViewModes: LessonViewMode[] = ["study", "debug"];

export function LessonViewModeToggle({
 presentation = "toolbar",
}: {
 presentation?: EditingToolsPresentation;
}) {
 const mode = useHanziHomeFeatureSelector((state) => state.viewMode);
 const { setViewMode } = useHanziHomeFeatureActions();

 return (
  <div
   className={presentation === "menu" ? "grid gap-1" : "flex shrink-0 rounded-lg bg-bg-subtle p-1"}
  >
   {lessonViewModes.map((value) => (
    <Button
     key={value}
     type="button"
     variant={
      presentation === "menu"
       ? mode === value
         ? "menuActive"
         : "menu"
       : mode === value
         ? "active"
         : "ghost"
     }
     size="sm"
     role={presentation === "menu" ? "menuitemradio" : undefined}
     aria-checked={presentation === "menu" ? mode === value : undefined}
     onClick={() => setViewMode(value)}
    >
     {value === "study" ? <GraduationCap /> : <Bug />}
     {value === "study" ? "Học tập" : "Kiểm tra dữ liệu"}
    </Button>
   ))}
  </div>
 );
}
