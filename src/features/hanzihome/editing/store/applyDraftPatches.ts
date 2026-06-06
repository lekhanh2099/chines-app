import type { HanyuLesson } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import {
 createValueAtPath,
 deleteValueAtPath,
 reorderValueAtPath,
 setValueAtPath,
} from "./pathUtils";
import type { DraftPatch } from "./types";

export type ApplyDraftPatchesResult = {
 lesson: HanyuLesson;
 skippedPatchIds: string[];
};

export function applyDraftPatches(
 originalLesson: HanyuLesson,
 patches: DraftPatch[],
): ApplyDraftPatchesResult {
 const lesson = structuredClone(originalLesson);
 const skippedPatchIds: string[] = [];

 for (const patch of patches) {
  let applied = false;

  if (patch.op === "update") {
   applied = setValueAtPath(lesson, patch.path, structuredClone(patch.after));
  } else if (patch.op === "create") {
   applied = createValueAtPath(lesson, patch.path, structuredClone(patch.after));
  } else if (patch.op === "delete") {
   applied = deleteValueAtPath(lesson, patch.path);
  } else {
   applied = reorderValueAtPath(lesson, patch.path, structuredClone(patch.after));
  }

  if (!applied) skippedPatchIds.push(patch.id);
 }

 return { lesson, skippedPatchIds };
}
