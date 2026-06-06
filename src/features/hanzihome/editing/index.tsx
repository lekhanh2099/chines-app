"use client";

import { useMemo } from "react";

import type { HanziHomeLesson } from "@/features/hanzihome/types";

import { DraftChangesPanel } from "./components/DraftChangesPanel";
import { EditableDialogShell } from "./components/EditableDialogShell";
import { EditModeToggle } from "./components/EditModeToggle";
import { applyDraftPatches } from "./store/applyDraftPatches";
import { setValueAtPath } from "./store/pathUtils";
import { useHanziHomeDraftStore } from "./store/useHanziHomeDraftStore";

export { EditableNodeWrapper } from "./components/EditableNodeWrapper";
export { NestedEditControls } from "./components/NestedEditControls";
export type {
 DraftPatch,
 DraftPatchPath,
 EditableEntityType,
} from "./store/types";

export function HanziHomeEditingTools({ lessonId }: { lessonId: string }) {
 return (
  <>
   <div className="flex flex-wrap items-center gap-1.5">
    <EditModeToggle />
    <DraftChangesPanel lessonId={lessonId} />
   </div>
   <EditableDialogShell />
  </>
 );
}

export function useDraftPatchedLesson(lesson: HanziHomeLesson): HanziHomeLesson {
 const patches = useHanziHomeDraftStore((state) => state.patches);
 const lessonPatches = useMemo(
  () => patches.filter((patch) => patch.lessonId === lesson.id),
  [lesson.id, patches],
 );

 return useMemo(() => {
  if (lessonPatches.length === 0) return lesson;

  const output = structuredClone(lesson);
  const sourceLessonPatches = lessonPatches.filter(
   (patch) => patch.path[0] === "lesson",
  );
  const viewModelPatches = lessonPatches.filter(
   (patch) => patch.path[0] !== "lesson",
  );

  if (output.sourceLesson && sourceLessonPatches.length > 0) {
   const result = applyDraftPatches(output.sourceLesson, sourceLessonPatches);
   output.sourceLesson = result.lesson;
  }

  for (const patch of viewModelPatches) {
   if (patch.op !== "update") continue;
   setValueAtPath(output, patch.path, structuredClone(patch.after));
  }

  return output;
 }, [lesson, lessonPatches]);
}
