"use client";

import { Button } from "@/components/ui/button";
import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
} from "@/components/ui/resizable";
import { HanziHomeStudyTabs } from "@/features/hanzihome/components/HanziHomeStudyTabs";
import { HanziHomeDeveloperTools } from "@/features/hanzihome/components/layout/HanziHomeDeveloperTools";
import { WorkspacePane } from "@/features/hanzihome/components/layout/WorkspacePane";
import { flatTabs } from "@/features/hanzihome/components/layout/moduleMeta";
import { LessonModuleContent } from "@/features/hanzihome/components/modules/LessonModuleContent";
import { DebugRawDataPanel } from "@/features/hanzihome/components/lesson-overview/StudySection";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeWorkspaceLayout } from "@/features/hanzihome/context/selectors";
import {
 developerToolsEnabled,
 setPaneActive,
} from "@/features/hanzihome/context/workspaceLayout";

export function ModuleSplitWorkspaceContent() {
 const runtime = useHanziHomeRuntime();
 const { splitEnabled, paneLayout, viewMode, splitPaneSize } =
  useHanziHomeWorkspaceLayout();
 const actions = useHanziHomeFeatureActions();

 const debugPanel =
  developerToolsEnabled &&
  viewMode === "debug" &&
  runtime.activeModule !== "overview" ? (
   <div className="hidden xl:block">
    <DebugRawDataPanel
     title="Raw lesson JSON"
     value={runtime.lesson.sourceLesson ?? runtime.lesson}
    />
   </div>
  ) : null;

 if (!splitEnabled) {
  return (
   <div className="grid gap-2">
    <div className="sticky top-0 z-30 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default bg-bg-card/95 p-1 shadow-theme-sm backdrop-blur">
     <div className="min-w-0 flex-1">
      <HanziHomeStudyTabs
       value={runtime.activeModule}
       items={flatTabs}
       onChange={(module) => {
        const paneId = paneLayout.left.includes(module) ? "left" : "right";
        actions.setPaneLayout(setPaneActive(paneLayout, paneId, module));
        runtime.selectModule(module);
       }}
       className="bg-transparent p-0 shadow-none"
      />
     </div>
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="hidden h-8 shrink-0 px-2.5 text-sm xl:flex"
      onClick={() => actions.setSplitEnabled(true)}
     >
      Mở split
     </Button>
    </div>
    <HanziHomeDeveloperTools />
    <LessonModuleContent module={runtime.activeModule} />
    {debugPanel}
   </div>
  );
 }

 return (
  <div className="grid gap-2 xl:h-[calc(100dvh-8.25rem)] xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden">
   <div className="sticky top-0 z-30 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default bg-bg-card/95 p-1 shadow-theme-sm backdrop-blur">
    <div className="min-w-0 px-2">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Split mode
     </p>
     <p className="hidden text-xs font-bold text-text-muted sm:block">
      Kéo tab giữa hai pane, kéo divider để đổi kích thước.
     </p>
    </div>
    <HanziHomeDeveloperTools inline />
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="h-8 shrink-0 px-2.5 text-sm"
     onClick={() => actions.setSplitEnabled(false)}
    >
     Tắt split
    </Button>
   </div>
   <div className="grid min-w-0 gap-2 xl:hidden">
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
 );
}

