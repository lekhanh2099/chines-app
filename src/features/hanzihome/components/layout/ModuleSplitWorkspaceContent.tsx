"use client";

import { lessonDisplaySettings, lessonBookKey } from "@/features/hanzihome/utils/learning-state";

import { Columns2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { useUnsavedDraftGuard } from "@/components/layout/navigation/UnsavedDraftNavigationGuard";
import { DropdownMenuItem } from "@/components/ui/overlays/dropdown-menu";
import { DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/overlays/dropdown-menu";
import { HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID } from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import {
 HanziHomeDeveloperTools,
 HanziHomeDeveloperToolsMenuContent,
 HanziHomeDeveloperToolsSheetContent,
} from "@/features/hanzihome/components/layout/HanziHomeDeveloperTools";
import { HanziHomeReadingSettingsTrigger } from "@/features/hanzihome/components/layout/HanziHomeReadingSettingsTrigger";
import { WorkspaceToolbar } from "@/features/hanzihome/components/layout/WorkspaceToolbar";
import { tabsForLesson } from "@/features/hanzihome/components/layout/moduleMeta";
import { LearningSyncStatus } from "@/features/hanzihome/components/layout/LearningSyncStatus";
import {
 ModuleSelectorControls,
 ModuleSplitPanes,
 ReadOnlyWorkspaceToolsMenu,
} from "@/features/hanzihome/components/layout/ModuleSplitWorkspaceViews";
import {
 useModuleSplitActivePaneSync,
 useModuleSplitViewport,
} from "@/features/hanzihome/components/layout/useModuleSplitWorkspaceLayout";
import { LessonModuleContent } from "@/features/hanzihome/components/modules/LessonModuleContent";
import { DebugRawDataPanel } from "@/features/hanzihome/components/lesson-overview/DebugRawDataPanel";
import { HanziHomeEditingDialogShell } from "@/features/hanzihome/editing";
import { type LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import {
 useHanziHomeEditMode,
 useHanziHomeFeatureSelector,
 useHanziHomeWorkspaceLayout,
} from "@/features/hanzihome/context/selectors";
import type { PaneId, StudyModule } from "@/features/hanzihome/context/types";
import { developerToolsEnabled, setPaneActive } from "@/features/hanzihome/context/workspaceLayout";

export { LearningSyncStatus };

export function ModuleSplitWorkspaceContent() {
 const tModules = useTranslations("Shell.studyModules");
 const runtime = useHanziHomeRuntime();
 const canEdit = useHanziHomeCanEdit();
 const editMode = useHanziHomeEditMode();
 const { splitEnabled, paneLayout, activePane, viewMode, splitPaneSize } =
  useHanziHomeWorkspaceLayout();
 const actions = useHanziHomeFeatureActions();
 const requestNavigation = useUnsavedDraftGuard(false);
 const lessonTextSelectedSectionId = useHanziHomeFeatureSelector(
  (state) => state.lessonTextSelectedSectionId,
 );
 const { isMobileSplit, isHorizontalSplit } = useModuleSplitViewport();
 const isListeningLesson = runtime.lesson.tags?.includes("listening") ?? false;
 const effectiveSplitEnabled = splitEnabled && !isListeningLesson && !runtime.readOnly;
 const lessonTabs = tabsForLesson(runtime.lesson, tModules);

 useModuleSplitActivePaneSync({
  actions,
  activeModule: runtime.activeModule,
  activePane,
  effectiveSplitEnabled,
  paneLayout,
 });

 const selectModule = (module: StudyModule) => {
  if (module !== runtime.activeModule) requestNavigation(() => runtime.selectModule(module));
 };

 const selectActivePane = (paneId: PaneId) => {
  actions.setActivePane(paneId);
  runtime.selectModule(paneId === "left" ? paneLayout.activeLeft : paneLayout.activeRight);
 };

 const enableSplit = () => {
  requestNavigation(() => {
   if (paneLayout.left.includes(runtime.activeModule)) {
    actions.setActivePane("left");
    actions.setPaneLayout(setPaneActive(paneLayout, "left", runtime.activeModule));
   } else if (paneLayout.right.includes(runtime.activeModule)) {
    actions.setActivePane("right");
    actions.setPaneLayout(setPaneActive(paneLayout, "right", runtime.activeModule));
   }
   actions.setSplitEnabled(true);
  });
 };

 const workspaceTools = runtime.readOnly ? (
  <ReadOnlyWorkspaceToolsMenu />
 ) : (
  <HanziHomeDeveloperTools inline>
   <DropdownMenuItem onSelect={enableSplit}>
    <Columns2 />
    {tModules("splitScreen")}
   </DropdownMenuItem>
  </HanziHomeDeveloperTools>
 );
 const readOnlyDisplayMode = lessonDisplaySettings(runtime.learningState, runtime.lesson);
 const readingSettingsTrigger = (
  <HanziHomeReadingSettingsTrigger
   displayMode={readOnlyDisplayMode}
   onDisplayModeChange={(updates: Partial<LessonDisplayMode>) => {
    runtime.updateLearningSettings({
     bookDisplayModes: {
      [lessonBookKey(runtime.lesson)]: { ...readOnlyDisplayMode, ...updates },
     },
    });
   }}
  />
 );
 const readerToolsMenuContent = runtime.readOnly ? (
  <>
   <DropdownMenuSeparator />
   <DropdownMenuLabel>{tModules("workspace")}</DropdownMenuLabel>
   <DropdownMenuItem disabled>
    <Lock />
    {tModules("readOnlyContent")}
   </DropdownMenuItem>
  </>
 ) : (
  <HanziHomeDeveloperToolsMenuContent leadingSeparator>
   <DropdownMenuItem
    onSelect={
     effectiveSplitEnabled
      ? () => requestNavigation(() => actions.setSplitEnabled(false))
      : enableSplit
    }
   >
    <Columns2 />
    {effectiveSplitEnabled ? tModules("closeSplitScreen") : tModules("splitScreen")}
   </DropdownMenuItem>
  </HanziHomeDeveloperToolsMenuContent>
 );
 const readerToolsSheetContent = runtime.readOnly ? undefined : (
  <HanziHomeDeveloperToolsSheetContent
   splitEnabled={effectiveSplitEnabled}
   onToggleSplit={
    effectiveSplitEnabled
     ? () => requestNavigation(() => actions.setSplitEnabled(false))
     : enableSplit
   }
  />
 );

 const workspaceControls = effectiveSplitEnabled ? (
  <div className="flex w-full min-w-0 items-center justify-end gap-1.5 sm:gap-2">
   <LearningSyncStatus />
   <div
    id={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}
    className="flex min-w-0 shrink-0 items-center justify-end gap-1.5"
   />
   {runtime.activeModule === "lessonText" ? null : (
    <>
     {readingSettingsTrigger}
     {runtime.readOnly ? (
      workspaceTools
     ) : (
      <HanziHomeDeveloperTools inline>
       <DropdownMenuItem onSelect={() => requestNavigation(() => actions.setSplitEnabled(false))}>
        <Columns2 />
        {tModules("closeSplitScreen")}
       </DropdownMenuItem>
      </HanziHomeDeveloperTools>
     )}
    </>
   )}
  </div>
 ) : (
  <>
   <ModuleSelectorControls
    activeModule={runtime.activeModule}
    lessonTabs={lessonTabs}
    onSelectModule={selectModule}
   />
   <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
    <LearningSyncStatus />
    <div
     id={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}
     className="flex min-w-0 shrink-0 items-center justify-end gap-1.5"
    />
    {runtime.activeModule === "lessonText" ? null : readingSettingsTrigger}
    {runtime.activeModule === "lessonText" ? null : workspaceTools}
   </div>
  </>
 );

 const debugPanel =
  !runtime.readOnly &&
  developerToolsEnabled &&
  canEdit &&
  editMode &&
  viewMode === "debug" &&
  runtime.activeModule !== "overview" ? (
   <div className="hidden xl:block">
    <DebugRawDataPanel
     title={tModules("rawLessonJson")}
     value={runtime.lesson.sourceLesson ?? runtime.lesson}
    />
   </div>
  ) : null;

 if (!effectiveSplitEnabled) {
  return (
   <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
    <WorkspaceToolbar>
     <div className="flex min-w-0 flex-1 items-center gap-2">{workspaceControls}</div>
    </WorkspaceToolbar>
    <div className="grid h-full min-h-0 overflow-hidden">
     {runtime.activeModule === "lessonText" && !runtime.readOnly ? (
      <HanziHomeEditingDialogShell />
     ) : null}
     <div className="min-h-0 min-w-0 overflow-y-auto scrollbar-soft">
      <LessonModuleContent
       module={runtime.activeModule}
       lessonTextSelectedSectionId={lessonTextSelectedSectionId}
       onSelectLessonTextSection={actions.selectLessonTextSection}
       readerToolsMenuContent={
        runtime.activeModule === "lessonText" ? readerToolsMenuContent : undefined
       }
       readerToolsSheetContent={
        runtime.activeModule === "lessonText" ? readerToolsSheetContent : undefined
       }
      />
     </div>
     {debugPanel}
    </div>
   </div>
  );
 }

 return (
  <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
   <WorkspaceToolbar>{workspaceControls}</WorkspaceToolbar>
   <div className="grid h-full min-h-0 min-w-0 overflow-hidden">
    {runtime.activeModule === "lessonText" && !runtime.readOnly ? (
     <HanziHomeEditingDialogShell />
    ) : null}
    <ModuleSplitPanes
     activePane={activePane}
     isHorizontalSplit={isHorizontalSplit}
     isMobileSplit={isMobileSplit}
     paneLayout={paneLayout}
     readerToolsMenuContent={readerToolsMenuContent}
     readerToolsSheetContent={readerToolsSheetContent}
     splitPaneSize={splitPaneSize}
     onSelectActivePane={selectActivePane}
     onSplitPaneResize={actions.setSplitPaneSize}
    />
    {debugPanel}
   </div>
  </div>
 );
}
