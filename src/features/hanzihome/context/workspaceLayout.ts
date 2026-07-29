"use client";

import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";
import {
 LessonViewModeSchema,
 StudyModuleSchema,
 type LessonViewMode,
 type PaneId,
 type PaneLayout,
 type StudyModule,
} from "./types";

const splitEnabledKey = "hanzihome:module-split-enabled:v1";
const paneLayoutKey = "hanzihome:module-pane-layout:v1";
const lessonViewModeKey = "hanzihome:lesson-view-mode:v1";
const splitPaneSizeKey = "hanzihome:module-split-size:v1";

export const developerToolsEnabled = process.env.NODE_ENV === "development";
export const contentEditingEnabled = true;

const splitStudyModules = [
 "overview",
 "lessonText",
 "notes",
 "vocab",
 "grammar",
 "review",
 "practice",
] satisfies readonly StudyModule[];

const splitStudyModuleSet = new Set<StudyModule>(splitStudyModules);

export const defaultPaneLayout: PaneLayout = {
 left: ["overview", "lessonText", "notes"],
 right: ["vocab", "grammar", "review", "practice"],
 activeLeft: "overview",
 activeRight: "vocab",
};

const NullableStudyModuleSchema = StudyModuleSchema.nullable();
const paneLayoutInputSchema = z.object({
 left: z.array(StudyModuleSchema).default([]),
 right: z.array(StudyModuleSchema).default([]),
 activeLeft: StudyModuleSchema.optional(),
 activeRight: StudyModuleSchema.optional(),
});

export function parseStudyModule(
 value: Parameters<typeof NullableStudyModuleSchema.safeParse>[0],
): z.infer<z.ZodNullable<typeof StudyModuleSchema>> {
 const parsed = NullableStudyModuleSchema.safeParse(value);
 return parsed.success ? parsed.data : null;
}

function uniqueModules(value: JsonFieldValue) {
 if (!Array.isArray(value)) return [];

 const seen = new Set<StudyModule>();
 const result: StudyModule[] = [];

 for (const item of value) {
  const parsed = parseStudyModule(typeof item === "string" ? item : null);

  if (parsed && !seen.has(parsed)) {
   seen.add(parsed);
   result.push(parsed);
  }
 }

 return result;
}

export function normalizePaneLayout(value: JsonFieldValue): PaneLayout {
 const parsed = paneLayoutInputSchema.safeParse(value);
 if (!parsed.success) return defaultPaneLayout;
 const input = parsed.data;
 const left = uniqueModules(input.left);
 const right = uniqueModules(input.right).filter(
  (item) => item === "lessonText" || !left.includes(item),
 );
 const assigned = new Set<StudyModule>([...left, ...right]);

 for (const item of splitStudyModules) {
  if (!assigned.has(item)) right.push(item);
 }

 const normalizedLeft = left.filter((item) => splitStudyModuleSet.has(item));
 const normalizedRight = right.filter((item) => splitStudyModuleSet.has(item));

 if (normalizedLeft.length === 0 || normalizedRight.length === 0) return defaultPaneLayout;

 return {
  left: normalizedLeft,
  right: normalizedRight,
  activeLeft:
   input.activeLeft && normalizedLeft.includes(input.activeLeft)
    ? input.activeLeft
    : normalizedLeft[0],
  activeRight:
   input.activeRight && normalizedRight.includes(input.activeRight)
    ? input.activeRight
    : normalizedRight[0],
 };
}

export function readWorkspacePreferences() {
 if (typeof window === "undefined") {
  return {
   splitEnabled: false,
   paneLayout: defaultPaneLayout,
   viewMode: LessonViewModeSchema.parse("study"),
   splitPaneSize: 48,
  };
 }

 let paneLayout = defaultPaneLayout;
 try {
  const stored = window.localStorage.getItem(paneLayoutKey);
  if (stored) paneLayout = normalizePaneLayout(JSON.parse(stored));
 } catch {
  paneLayout = defaultPaneLayout;
 }

 const storedSize = Number(window.localStorage.getItem(splitPaneSizeKey));

 return {
  splitEnabled: window.localStorage.getItem(splitEnabledKey) === "true",
  paneLayout,
  viewMode: LessonViewModeSchema.parse(
   developerToolsEnabled && window.localStorage.getItem(lessonViewModeKey) === "debug"
    ? "debug"
    : "study",
  ),
  splitPaneSize:
   Number.isFinite(storedSize) && storedSize >= 38 && storedSize <= 62 ? storedSize : 48,
 };
}

export function persistSplitEnabled(enabled: boolean) {
 window.localStorage.setItem(splitEnabledKey, enabled ? "true" : "false");
}

export function persistPaneLayout(layout: PaneLayout) {
 window.localStorage.setItem(paneLayoutKey, JSON.stringify(normalizePaneLayout(layout)));
}

export function persistViewMode(mode: LessonViewMode) {
 if (developerToolsEnabled) window.localStorage.setItem(lessonViewModeKey, mode);
}

export function persistSplitPaneSize(size: number) {
 window.localStorage.setItem(splitPaneSizeKey, String(size));
}

export function setPaneActive(layout: PaneLayout, paneId: PaneId, module: StudyModule) {
 return normalizePaneLayout({
  ...layout,
  activeLeft: paneId === "left" ? module : layout.activeLeft,
  activeRight: paneId === "right" ? module : layout.activeRight,
 });
}

export function moveModuleInLayout(
 layout: PaneLayout,
 module: StudyModule,
 sourcePane: PaneId,
 targetPane: PaneId,
 targetIndex: number,
) {
 const sourceItems = sourcePane === "left" ? layout.left : layout.right;

 if (!sourceItems.includes(module)) return layout;

 if (module === "lessonText" && sourcePane !== targetPane) {
  const targetItems = [...(targetPane === "left" ? layout.left : layout.right)];
  const existingIndex = targetItems.indexOf(module);
  if (existingIndex >= 0) targetItems.splice(existingIndex, 1);
  targetItems.splice(Math.max(0, Math.min(targetIndex, targetItems.length)), 0, module);

  return normalizePaneLayout({
   ...layout,
   left: targetPane === "left" ? targetItems : layout.left,
   right: targetPane === "right" ? targetItems : layout.right,
   activeLeft: targetPane === "left" ? module : layout.activeLeft,
   activeRight: targetPane === "right" ? module : layout.activeRight,
  });
 }

 if (sourcePane !== targetPane && sourceItems.length <= 1) return layout;

 const nextLeft = [...layout.left];
 const nextRight = [...layout.right];
 const nextSourceItems = sourcePane === "left" ? nextLeft : nextRight;
 const sourceIndex = nextSourceItems.indexOf(module);
 nextSourceItems.splice(sourceIndex, 1);

 const targetItems = targetPane === "left" ? nextLeft : nextRight;
 const existingTargetIndex = targetItems.indexOf(module);
 if (existingTargetIndex >= 0) targetItems.splice(existingTargetIndex, 1);
 targetItems.splice(Math.max(0, Math.min(targetIndex, targetItems.length)), 0, module);

 return normalizePaneLayout({
  left: nextLeft,
  right: nextRight,
  activeLeft:
   targetPane === "left"
    ? module
    : nextLeft.includes(layout.activeLeft)
      ? layout.activeLeft
      : nextLeft[0],
  activeRight:
   targetPane === "right"
    ? module
    : nextRight.includes(layout.activeRight)
      ? layout.activeRight
      : nextRight[0],
 });
}
