"use client";

import type { ComponentProps } from "react";
import { Lock, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
} from "@/components/ui/layout/resizable";
import { HanziHomeStudyTabs } from "@/features/hanzihome/components/HanziHomeStudyTabs";
import { WorkspacePane } from "@/features/hanzihome/components/layout/WorkspacePane";
import { moduleMeta, tabsForLesson } from "@/features/hanzihome/components/layout/moduleMeta";
import type { useHanziHomeWorkspaceLayout } from "@/features/hanzihome/context/selectors";
import type { PaneId, StudyModule } from "@/features/hanzihome/context/types";
import { parseStudyModule } from "@/features/hanzihome/context/workspaceLayout";

type WorkspaceLayout = ReturnType<typeof useHanziHomeWorkspaceLayout>;
type WorkspacePaneProps = ComponentProps<typeof WorkspacePane>;

export function ModuleSelectorControls({
 activeModule,
 lessonTabs,
 onSelectModule,
}: {
 activeModule: StudyModule;
 lessonTabs: ReturnType<typeof tabsForLesson>;
 onSelectModule: (module: StudyModule) => void;
}) {
 const tModules = useTranslations("Shell.studyModules");

 return (
  <div className="min-w-0 flex-1">
   <div className="xl:hidden">
    <Select
     value={activeModule}
     onValueChange={(module) => {
      const selectedModule = parseStudyModule(module);
      if (selectedModule) onSelectModule(selectedModule);
     }}
    >
     <SelectTrigger aria-label={tModules("selectAria")} size="sm" width="full">
      <SelectValue>{tModules(moduleMeta[activeModule].key)}</SelectValue>
     </SelectTrigger>
     <SelectContent
      side="bottom"
      align="start"
      collisionPadding={8}
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
     value={activeModule}
     items={lessonTabs}
     onChange={onSelectModule}
     compact
     surface="transparent"
    />
   </div>
  </div>
 );
}

export function ModuleSplitPanes({
 activePane,
 isHorizontalSplit,
 isMobileSplit,
 paneLayout,
 readerToolsMenuContent,
 readerToolsSheetContent,
 splitPaneSize,
 onSelectActivePane,
 onSplitPaneResize,
}: {
 activePane: WorkspaceLayout["activePane"];
 isHorizontalSplit: boolean;
 isMobileSplit: boolean;
 paneLayout: WorkspaceLayout["paneLayout"];
 readerToolsMenuContent: WorkspacePaneProps["readerToolsMenuContent"];
 readerToolsSheetContent: WorkspacePaneProps["readerToolsSheetContent"];
 splitPaneSize: WorkspaceLayout["splitPaneSize"];
 onSelectActivePane: (paneId: PaneId) => void;
 onSplitPaneResize: (size: number) => void;
}) {
 const tModules = useTranslations("Shell.studyModules");

 if (isMobileSplit) {
  return (
   <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
    <SegmentedControl<PaneId>
     value={activePane}
     items={[
      {
       key: "left",
       label: tModules("paneLabel", {
        number: 1,
        module: tModules(moduleMeta[paneLayout.activeLeft].key),
       }),
      },
      {
       key: "right",
       label: tModules("paneLabel", {
        number: 2,
        module: tModules(moduleMeta[paneLayout.activeRight].key),
       }),
      },
     ]}
     onChange={onSelectActivePane}
     density="touch"
     aria-label={tModules("activePaneAria")}
    />
    <div className="grid min-h-0 min-w-0 overflow-hidden">
     <div className={activePane === "left" ? "min-h-0 min-w-0 overflow-hidden" : "hidden"}>
      <WorkspacePane
       paneId="left"
       readerToolsMenuContent={readerToolsMenuContent}
       readerToolsSheetContent={readerToolsSheetContent}
      />
     </div>
     <div className={activePane === "right" ? "min-h-0 min-w-0 overflow-hidden" : "hidden"}>
      <WorkspacePane
       paneId="right"
       readerToolsMenuContent={readerToolsMenuContent}
       readerToolsSheetContent={readerToolsSheetContent}
      />
     </div>
    </div>
   </div>
  );
 }

 return (
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
    onResize={(size) => onSplitPaneResize(Math.round(size.asPercentage))}
   >
    <WorkspacePane
     paneId="left"
     readerToolsMenuContent={readerToolsMenuContent}
     readerToolsSheetContent={readerToolsSheetContent}
    />
   </ResizablePanel>
   <ResizableHandle />
   <ResizablePanel
    id="right"
    className="min-h-0 min-w-0 overflow-hidden"
    minSize={isHorizontalSplit ? 38 : 30}
    defaultSize={100 - splitPaneSize}
   >
    <WorkspacePane
     paneId="right"
     readerToolsMenuContent={readerToolsMenuContent}
     readerToolsSheetContent={readerToolsSheetContent}
    />
   </ResizablePanel>
  </ResizablePanelGroup>
 );
}

export function ReadOnlyWorkspaceToolsMenu() {
 const tModules = useTranslations("Shell.studyModules");

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button type="button" variant="outline" size="toolbar" aria-label={tModules("openTools")}>
     <SlidersHorizontal />
     <span className="hidden sm:inline">{tModules("tools")}</span>
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" width="md">
    <DropdownMenuLabel>{tModules("workspace")}</DropdownMenuLabel>
    <DropdownMenuItem disabled>
     <Lock />
     {tModules("readOnlyContent")}
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
