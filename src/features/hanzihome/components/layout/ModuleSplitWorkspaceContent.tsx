"use client";

import { Columns2, CloudOff, RefreshCcw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { HanziHomeStudyTabs } from "@/features/hanzihome/components/HanziHomeStudyTabs";
import { HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID } from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { HanziHomeDeveloperTools } from "@/features/hanzihome/components/layout/HanziHomeDeveloperTools";
import { HanziHomeReadingSettingsTrigger } from "@/features/hanzihome/components/layout/HanziHomeReadingSettingsTrigger";
import { WorkspacePane } from "@/features/hanzihome/components/layout/WorkspacePane";
import { WorkspaceToolbar } from "@/features/hanzihome/components/layout/WorkspaceToolbar";
import { moduleMeta, tabsForLesson } from "@/features/hanzihome/components/layout/moduleMeta";
import { LessonModuleContent } from "@/features/hanzihome/components/modules/LessonModuleContent";
import { DebugRawDataPanel } from "@/features/hanzihome/components/lesson-overview/DebugRawDataPanel";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import {
 useHanziHomeFeatureSelector,
 useHanziHomeWorkspaceLayout,
} from "@/features/hanzihome/context/selectors";
import type { PaneId, StudyModule } from "@/features/hanzihome/context/types";
import {
 developerToolsEnabled,
 parseStudyModule,
 setPaneActive,
} from "@/features/hanzihome/context/workspaceLayout";

function LearningSyncStatus() {
 const runtime = useHanziHomeRuntime();
 const sync = runtime.learningSync;

 if (!sync) return null;

 const hasOfflinePendingWrites = !sync.isOnline && sync.pendingCount > 0;
 const hasSyncError = sync.status === "error";

 if (!hasOfflinePendingWrites && !hasSyncError) return null;

 if (hasOfflinePendingWrites) {
  return (
   <Badge variant="warning" size="md">
    <WifiOff />
    <span className="hidden sm:inline">Đã lưu offline</span>
    <span className="sm:hidden">Offline</span>
   </Badge>
  );
 }

 return (
  <div className="flex shrink-0 items-center gap-1">
   <Badge
    variant="danger"
    size="md"
    title={sync.lastError || "Tiến độ đã lưu trên máy này, nhưng chưa sync lên server."}
   >
    <CloudOff />
    <span className="hidden sm:inline">Chưa sync</span>
    <span className="sm:hidden">Sync lỗi</span>
   </Badge>
   <Button
    type="button"
    variant="ghost"
    size="icon-toolbar"
    aria-label="Thử sync lại tiến độ"
    title="Thử sync lại tiến độ"
    onClick={() => {
     void sync.retry();
    }}
   >
    <RefreshCcw />
   </Button>
  </div>
 );
}

export function ModuleSplitWorkspaceContent() {
 const runtime = useHanziHomeRuntime();
 const { splitEnabled, paneLayout, activePane, viewMode, splitPaneSize } =
  useHanziHomeWorkspaceLayout();
 const actions = useHanziHomeFeatureActions();
 const lessonTextSelectedSectionId = useHanziHomeFeatureSelector(
  (state) => state.lessonTextSelectedSectionId,
 );
 const [isMobileSplit, setIsMobileSplit] = useState(false);
 const [isHorizontalSplit, setIsHorizontalSplit] = useState(false);
 const isListeningLesson = runtime.lesson.tags?.includes("listening") ?? false;
 const effectiveSplitEnabled = splitEnabled && !isListeningLesson;
 const lessonTabs = tabsForLesson(runtime.lesson);

 useEffect(() => {
  const mobileQuery = window.matchMedia("(max-width: 39.999rem)");
  const horizontalQuery = window.matchMedia("(min-width: 64rem)");
  const updateLayout = () => {
   setIsMobileSplit(mobileQuery.matches);
   setIsHorizontalSplit(horizontalQuery.matches);
  };

  updateLayout();
  mobileQuery.addEventListener("change", updateLayout);
  horizontalQuery.addEventListener("change", updateLayout);

  return () => {
   mobileQuery.removeEventListener("change", updateLayout);
   horizontalQuery.removeEventListener("change", updateLayout);
  };
 }, []);

 useEffect(() => {
  if (!effectiveSplitEnabled) return;

  const activePaneModules = activePane === "left" ? paneLayout.left : paneLayout.right;
  if (activePaneModules.includes(runtime.activeModule)) {
   const activePaneModule = activePane === "left" ? paneLayout.activeLeft : paneLayout.activeRight;
   if (activePaneModule !== runtime.activeModule) {
    actions.setPaneLayout(setPaneActive(paneLayout, activePane, runtime.activeModule));
   }
   return;
  }

  const otherPane = activePane === "left" ? "right" : "left";
  const otherPaneModules = otherPane === "left" ? paneLayout.left : paneLayout.right;
  if (otherPaneModules.includes(runtime.activeModule)) {
   actions.setActivePane(otherPane);
   const otherPaneModule = otherPane === "left" ? paneLayout.activeLeft : paneLayout.activeRight;
   if (otherPaneModule !== runtime.activeModule) {
    actions.setPaneLayout(setPaneActive(paneLayout, otherPane, runtime.activeModule));
   }
  }
 }, [actions, activePane, effectiveSplitEnabled, paneLayout, runtime.activeModule]);

 const selectModule = (module: StudyModule) => {
  runtime.selectModule(module);
 };

 const selectActivePane = (paneId: PaneId) => {
  actions.setActivePane(paneId);
  runtime.selectModule(paneId === "left" ? paneLayout.activeLeft : paneLayout.activeRight);
 };

 const enableSplit = () => {
  if (paneLayout.left.includes(runtime.activeModule)) {
   actions.setActivePane("left");
   actions.setPaneLayout(setPaneActive(paneLayout, "left", runtime.activeModule));
  } else if (paneLayout.right.includes(runtime.activeModule)) {
   actions.setActivePane("right");
   actions.setPaneLayout(setPaneActive(paneLayout, "right", runtime.activeModule));
  }
  actions.setSplitEnabled(true);
 };

 const workspaceControls = effectiveSplitEnabled ? (
  <div className="flex w-full min-w-0 items-center justify-end gap-1.5 sm:gap-2">
   <LearningSyncStatus />
   <div
    id={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}
    className="flex min-w-0 shrink-0 items-center justify-end gap-1.5"
   />
   <HanziHomeReadingSettingsTrigger />
   <HanziHomeDeveloperTools inline>
    <DropdownMenuItem onSelect={() => actions.setSplitEnabled(false)}>
     <Columns2 />
     Đóng chia đôi màn hình
    </DropdownMenuItem>
   </HanziHomeDeveloperTools>
  </div>
 ) : (
  <>
   <div className="min-w-0 flex-1">
    <div className="xl:hidden">
     <Select
      value={runtime.activeModule}
      onValueChange={(module) => {
       const selectedModule = parseStudyModule(module);
       if (selectedModule) selectModule(selectedModule);
      }}
     >
      <SelectTrigger aria-label="Chọn nội dung học" size="sm" width="full">
       <SelectValue />
      </SelectTrigger>
      <SelectContent
       side="bottom"
       align="start"
       avoidCollisions={false}
       className="max-h-80 min-w-[var(--radix-select-trigger-width)]"
      >
       <SelectGroup>
        {lessonTabs.map((item) => (
         <SelectItem key={item.key} value={item.key}>
          {item.label}
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>
    </div>
    <div className="hidden xl:block">
     <HanziHomeStudyTabs
      value={runtime.activeModule}
      items={lessonTabs}
      onChange={selectModule}
      compact
      surface="transparent"
     />
    </div>
   </div>
   <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
    <LearningSyncStatus />
    <div
     id={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}
     className="flex min-w-0 shrink-0 items-center justify-end gap-1.5"
    />
    <HanziHomeReadingSettingsTrigger />
    <HanziHomeDeveloperTools inline>
     <DropdownMenuItem onSelect={enableSplit}>
      <Columns2 />
      Chia đôi màn hình
     </DropdownMenuItem>
    </HanziHomeDeveloperTools>
   </div>
  </>
 );

 const debugPanel =
  developerToolsEnabled && viewMode === "debug" && runtime.activeModule !== "overview" ? (
   <div className="hidden xl:block">
    <DebugRawDataPanel
     title="Raw lesson JSON"
     value={runtime.lesson.sourceLesson ?? runtime.lesson}
    />
   </div>
  ) : null;

 if (!effectiveSplitEnabled) {
  return (
   <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
    <WorkspaceToolbar>{workspaceControls}</WorkspaceToolbar>
    <div className="grid h-full min-h-0 overflow-hidden">
     <div className="min-h-0 min-w-0 overflow-y-auto scrollbar-soft">
      <LessonModuleContent
       module={runtime.activeModule}
       lessonTextSelectedSectionId={lessonTextSelectedSectionId}
       onSelectLessonTextSection={actions.selectLessonTextSection}
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
    {isMobileSplit ? (
     <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
      <SegmentedControl<PaneId>
       value={activePane}
       items={[
        { key: "left", label: `Khung 1 · ${moduleMeta[paneLayout.activeLeft].label}` },
        { key: "right", label: `Khung 2 · ${moduleMeta[paneLayout.activeRight].label}` },
       ]}
       onChange={selectActivePane}
       density="touch"
       aria-label="Khung đang hiển thị"
      />
      <div className="grid min-h-0 min-w-0 overflow-hidden">
       <div className={activePane === "left" ? "min-h-0 min-w-0 overflow-hidden" : "hidden"}>
        <WorkspacePane paneId="left" />
       </div>
       <div className={activePane === "right" ? "min-h-0 min-w-0 overflow-hidden" : "hidden"}>
        <WorkspacePane paneId="right" />
       </div>
      </div>
     </div>
    ) : (
     <ResizablePanelGroup
      key={isHorizontalSplit ? "horizontal" : "vertical"}
      orientation={isHorizontalSplit ? "horizontal" : "vertical"}
      defaultLayout={{ left: splitPaneSize, right: 100 - splitPaneSize }}
      className="min-h-0 min-w-0 overflow-hidden"
     >
      <ResizablePanel
       id="left"
       className="min-h-0 min-w-0 overflow-hidden"
       minSize={isHorizontalSplit ? 38 : 30}
       defaultSize={splitPaneSize}
       onResize={(size) => actions.setSplitPaneSize(Math.round(size.asPercentage))}
      >
       <WorkspacePane paneId="left" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
       id="right"
       className="min-h-0 min-w-0 overflow-hidden"
       minSize={isHorizontalSplit ? 38 : 30}
       defaultSize={100 - splitPaneSize}
      >
       <WorkspacePane paneId="right" />
      </ResizablePanel>
     </ResizablePanelGroup>
    )}
    {debugPanel}
   </div>
  </div>
 );
}
