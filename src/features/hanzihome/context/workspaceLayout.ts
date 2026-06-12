"use client";

import type { LessonViewMode, PaneId, PaneLayout, StudyModule } from "./types";

const splitEnabledKey = "hanzihome:module-split-enabled:v1";
const paneLayoutKey = "hanzihome:module-pane-layout:v1";
const lessonViewModeKey = "hanzihome:lesson-view-mode:v1";
const splitPaneSizeKey = "hanzihome:module-split-size:v1";

export const developerToolsEnabled = process.env.NODE_ENV === "development";

export const studyModules = [
 "overview",
 "lessonText",
 "notes",
 "vocab",
 "grammar",
 "review",
] as const satisfies readonly StudyModule[];

export const defaultPaneLayout: PaneLayout = {
 left: ["overview", "lessonText", "notes"],
 right: ["vocab", "grammar", "review"],
 activeLeft: "overview",
 activeRight: "vocab",
};

export function parseStudyModule(value: string | null | undefined): StudyModule | null {
 return studyModules.some((item) => item === value) ? (value as StudyModule) : null;
}

function uniqueModules(value: unknown) {
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

export function normalizePaneLayout(value: unknown): PaneLayout {
 if (!value || typeof value !== "object") return defaultPaneLayout;

 const input = value as Partial<PaneLayout>;
 const left = uniqueModules(input.left);
 const right = uniqueModules(input.right).filter((item) => !left.includes(item));
 const assigned = new Set<StudyModule>([...left, ...right]);

 for (const item of studyModules) {
  if (!assigned.has(item)) right.push(item);
 }

 if (left.length === 0 || right.length === 0) return defaultPaneLayout;

 return {
  left,
  right,
  activeLeft: left.includes(input.activeLeft as StudyModule)
   ? (input.activeLeft as StudyModule)
   : left[0],
  activeRight: right.includes(input.activeRight as StudyModule)
   ? (input.activeRight as StudyModule)
   : right[0],
 };
}

export function readWorkspacePreferences() {
 if (typeof window === "undefined") {
  return {
   splitEnabled: false,
   paneLayout: defaultPaneLayout,
   viewMode: "study" as LessonViewMode,
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
  viewMode:
   developerToolsEnabled && window.localStorage.getItem(lessonViewModeKey) === "debug"
    ? ("debug" as const)
    : ("study" as const),
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
 targetPane: PaneId,
 targetIndex: number,
) {
 const sourcePane = layout.left.includes(module) ? "left" : "right";
 const sourceItems = sourcePane === "left" ? layout.left : layout.right;

 if (!sourceItems.includes(module)) return layout;
 if (sourcePane !== targetPane && sourceItems.length <= 1) return layout;

 const nextLeft = layout.left.filter((item) => item !== module);
 const nextRight = layout.right.filter((item) => item !== module);
 const targetItems = targetPane === "left" ? nextLeft : nextRight;
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
