"use client";

import { useEffect, useMemo } from "react";

import type { HanziHomeLesson } from "@/features/hanzihome/types";

import { DraftChangesPanel } from "./components/DraftChangesPanel";
import { EditableDialogShell } from "./components/EditableDialogShell";
import { EditModeToggle } from "./components/EditModeToggle";
import { applyDraftPatches } from "./store/applyDraftPatches";
import { setValueAtPath } from "./store/pathUtils";
import { useHanziHomeDraftStore } from "./store/useHanziHomeDraftStore";

export { EditableNodeWrapper } from "./components/EditableNodeWrapper";
export { NestedEditControls } from "./components/NestedEditControls";
export type { DraftPatch, DraftPatchPath, EditableEntityType } from "./store/types";

export function HanziHomeEditingTools() {
 return (
  <>
   <div className="flex flex-wrap items-center gap-1.5">
    <EditModeToggle />
    <DraftChangesPanel />
   </div>
   <EditableDialogShell />
  </>
 );
}

export function useDraftPatchedLesson(lesson: HanziHomeLesson): HanziHomeLesson {
 const patches = useHanziHomeDraftStore((state) => state.patches);
 const setSkippedPatchIds = useHanziHomeDraftStore((state) => state.setSkippedPatchIds);
 const lessonPatches = useMemo(
  () => patches.filter((patch) => patch.lessonId === lesson.id),
  [lesson.id, patches],
 );

 const patchedOutput = useMemo(() => {
  if (lessonPatches.length === 0) {
   return { lesson, skippedPatchIds: [] as string[] };
  }

  const output = structuredClone(lesson);
  const skippedPatchIds: string[] = [];
  const sourceLessonPatches = lessonPatches.filter((patch) => patch.path[0] === "lesson");
  const viewModelPatches = lessonPatches.filter((patch) => patch.path[0] !== "lesson");

  if (output.sourceLesson && sourceLessonPatches.length > 0) {
   const result = applyDraftPatches(output.sourceLesson, sourceLessonPatches);
   output.sourceLesson = result.lesson;
   skippedPatchIds.push(...result.skippedPatchIds);
  }

  for (const patch of viewModelPatches) {
   if (patch.op !== "update") continue;
   const applied = setValueAtPath(output, patch.path, structuredClone(patch.after));
   if (!applied) skippedPatchIds.push(patch.id);
  }

  return { lesson: output, skippedPatchIds };
 }, [lesson, lessonPatches]);

 useEffect(() => {
  setSkippedPatchIds(lesson.id, patchedOutput.skippedPatchIds);
 }, [lesson.id, patchedOutput.skippedPatchIds, setSkippedPatchIds]);

 return patchedOutput.lesson;
}
