"use client";

import { Button } from "@/components/ui/button";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";

export function LessonViewModeToggle() {
 const mode = useHanziHomeFeatureSelector((state) => state.viewMode);
 const { setViewMode } = useHanziHomeFeatureActions();

 return (
  <div className="flex shrink-0 rounded-lg bg-bg-subtle p-1">
   {(["study", "debug"] as const).map((value) => (
    <Button
     key={value}
     type="button"
     variant={mode === value ? "active" : "ghost"}
     size="sm"
     className="min-h-11 px-3 text-xs"
     onClick={() => setViewMode(value)}
    >
     {value === "study" ? "Study" : "Debug"}
    </Button>
   ))}
  </div>
 );
}
