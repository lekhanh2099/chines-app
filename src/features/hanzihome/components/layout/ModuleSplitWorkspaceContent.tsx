"use client";

import { Columns2, CloudOff, RefreshCcw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { HanziHomeStudyTabs } from "@/features/hanzihome/components/HanziHomeStudyTabs";
import { HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID } from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { HanziHomeDeveloperTools } from "@/features/hanzihome/components/layout/HanziHomeDeveloperTools";
import { WorkspacePane } from "@/features/hanzihome/components/layout/WorkspacePane";
import { tabsForLesson } from "@/features/hanzihome/components/layout/moduleMeta";
import { LessonModuleContent } from "@/features/hanzihome/components/modules/LessonModuleContent";
import { DebugRawDataPanel } from "@/features/hanzihome/components/lesson-overview/DebugRawDataPanel";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeWorkspaceLayout } from "@/features/hanzihome/context/selectors";
import type { StudyModule } from "@/features/hanzihome/context/types";
import { developerToolsEnabled, setPaneActive } from "@/features/hanzihome/context/workspaceLayout";

function LearningSyncStatusPill() {
 const runtime = useHanziHomeRuntime();
 const sync = runtime.learningSync;

 if (!sync) return null;

 const hasOfflinePendingWrites = !sync.isOnline && sync.pendingCount > 0;
 const hasSyncError = sync.status === "error";

 if (!hasOfflinePendingWrites && !hasSyncError) return null;

 if (hasOfflinePendingWrites) {
  return (
   <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-bold text-amber-800 shadow-theme-sm dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
    <WifiOff className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">Đã lưu offline</span>
    <span className="sm:hidden">Offline</span>
   </span>
  );
 }

 return (
  <span
   className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-2 text-xs font-bold text-destructive shadow-theme-sm"
   title={sync.lastError || "Tiến độ đã lưu trên máy này, nhưng chưa sync lên server."}
  >
   <CloudOff className="h-3.5 w-3.5" />
   <span className="hidden sm:inline">Chưa sync</span>
   <span className="sm:hidden">Sync lỗi</span>
   <Button
    type="button"
    variant="ghost"
    size="icon-xs"
    className="h-6 w-6 rounded-md text-current hover:bg-destructive/15"
    aria-label="Thử sync lại tiến độ"
    title="Thử sync lại tiến độ"
    onClick={() => {
     void sync.retry();
    }}
   >
    <RefreshCcw className="h-3 w-3" />
   </Button>
  </span>
 );
}

export function ModuleSplitWorkspaceContent() {
 const runtime = useHanziHomeRuntime();
 const { splitEnabled, paneLayout, viewMode, splitPaneSize } = useHanziHomeWorkspaceLayout();
 const actions = useHanziHomeFeatureActions();
 const isListeningLesson = runtime.lesson.tags?.includes("listening") ?? false;
 const effectiveSplitEnabled = splitEnabled && !isListeningLesson;
 const lessonTabs = tabsForLesson(runtime.lesson);

 const selectModule = (module: StudyModule) => {
  if (paneLayout.left.includes(module) || paneLayout.right.includes(module)) {
   const paneId = paneLayout.left.includes(module) ? "left" : "right";
   actions.setPaneLayout(setPaneActive(paneLayout, paneId, module));
  }
  runtime.selectModule(module);
 };

 const workspaceControls = effectiveSplitEnabled ? (
  <>
   <div className="min-w-0 px-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">Split mode</p>
    <p className="hidden text-xs font-bold text-text-muted xl:block">
     Kéo tab giữa hai pane, kéo divider để đổi kích thước.
    </p>
   </div>
   <div className="flex shrink-0 items-center gap-2">
    <LearningSyncStatusPill />
    <div
     id={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}
     className="flex min-w-0 shrink-0 items-center justify-end gap-1.5"
    />
    <HanziHomeDeveloperTools inline />
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="h-10 shrink-0 px-3 text-sm"
     onClick={() => actions.setSplitEnabled(false)}
    >
     <Columns2 className="h-4 w-4" />
     Tắt split
    </Button>
   </div>
  </>
 ) : (
  <>
   <div className="min-w-0 flex-1">
    <div className="xl:hidden">
     <Select
      value={runtime.activeModule}
      onValueChange={(module) => selectModule(module as StudyModule)}
     >
      <SelectTrigger
       aria-label="Chọn nội dung học"
       className="h-10 w-full min-w-0 rounded-lg bg-bg-card px-3 text-sm shadow-none"
      >
       <SelectValue />
      </SelectTrigger>
      <SelectContent
       side="bottom"
       align="start"
       avoidCollisions={false}
       className="max-h-80 min-w-[var(--radix-select-trigger-width)] text-sm"
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
      className="bg-transparent p-0 shadow-none"
     />
    </div>
   </div>
   <div className="flex shrink-0 items-center gap-2">
    <LearningSyncStatusPill />
    <div
     id={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}
     className="flex min-w-0 shrink-0 items-center justify-end gap-1.5"
    />
    <HanziHomeDeveloperTools inline />
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="hidden h-10 shrink-0 px-3 xl:flex"
     onClick={() => actions.setSplitEnabled(true)}
    >
     <Columns2 className="h-4 w-4" />
     Mở split
    </Button>
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
    <div className="hanzihome-liquid-toolbar relative z-30 flex min-w-0 items-center justify-between gap-1 overflow-hidden rounded-lg p-0.5 sm:gap-2 sm:rounded-xl sm:p-1">
     {workspaceControls}
    </div>
    <div className="grid h-full min-h-0 overflow-hidden">
     <div className="min-h-0 min-w-0 overflow-y-auto scrollbar-soft">
      <LessonModuleContent module={runtime.activeModule} />
     </div>
     {debugPanel}
    </div>
   </div>
  );
 }

 return (
  <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
   <div className="hanzihome-liquid-toolbar relative z-30 flex min-w-0 items-center justify-between gap-1 overflow-hidden rounded-lg p-0.5 sm:gap-2 sm:rounded-xl sm:p-1">
    {workspaceControls}
   </div>
   <div className="grid h-full min-h-0 overflow-hidden">
    <div className="grid min-h-0 min-w-0 gap-2 overflow-y-auto pr-1 scrollbar-soft xl:hidden">
     <WorkspacePane paneId="left" title="Nội dung" />
     <WorkspacePane paneId="right" title="Học & ôn" />
    </div>
    <ResizablePanelGroup
     orientation="horizontal"
     defaultLayout={{ left: splitPaneSize, right: 100 - splitPaneSize }}
     className="hidden min-h-0 min-w-0 overflow-hidden xl:flex xl:h-full"
    >
     <ResizablePanel
      id="left"
      className="min-h-0 min-w-0 overflow-hidden"
      minSize={38}
      defaultSize={splitPaneSize}
      onResize={(size) => actions.setSplitPaneSize(Math.round(size.asPercentage))}
     >
      <WorkspacePane paneId="left" title="Nội dung" className="h-full" />
     </ResizablePanel>
     <ResizableHandle />
     <ResizablePanel
      id="right"
      className="min-h-0 min-w-0 overflow-hidden"
      minSize={38}
      defaultSize={100 - splitPaneSize}
     >
      <WorkspacePane paneId="right" title="Học & ôn" className="h-full" />
     </ResizablePanel>
    </ResizablePanelGroup>
    {debugPanel}
   </div>
  </div>
 );
}
