"use client";

import { ModulePane } from "@/features/hanzihome/components/layout/ModulePane";
import { LessonModuleContent } from "@/features/hanzihome/components/modules/LessonModuleContent";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeWorkspaceLayout } from "@/features/hanzihome/context/selectors";
import type {
 PaneId,
 StudyModule,
} from "@/features/hanzihome/context/types";
import {
 moveModuleInLayout,
 setPaneActive,
} from "@/features/hanzihome/context/workspaceLayout";

export function WorkspacePane({
 paneId,
 title,
 className,
}: {
 paneId: PaneId;
 title: string;
 className?: string;
}) {
 const runtime = useHanziHomeRuntime();
 const { paneLayout, draggedModule } = useHanziHomeWorkspaceLayout();
 const actions = useHanziHomeFeatureActions();
 const items = paneId === "left" ? paneLayout.left : paneLayout.right;
 const activeModule =
  paneId === "left" ? paneLayout.activeLeft : paneLayout.activeRight;

 const selectModule = (module: StudyModule) => {
  actions.setPaneLayout(setPaneActive(paneLayout, paneId, module));
  runtime.selectModule(module);
 };

 const moveModule = (
  module: StudyModule,
  targetPane: PaneId,
  targetIndex: number,
 ) => {
  actions.setPaneLayout(
   moveModuleInLayout(paneLayout, module, targetPane, targetIndex),
  );
  runtime.selectModule(module);
 };

 return (
  <ModulePane
   title={title}
   items={items}
   activeModule={activeModule}
   paneId={paneId}
   draggedModule={draggedModule}
   className={className}
   onDragStart={actions.setDraggedModule}
   onDragEnd={() => actions.setDraggedModule(null)}
   onMoveModule={moveModule}
   onSelectModule={selectModule}
  >
   <LessonModuleContent module={activeModule} compact />
  </ModulePane>
 );
}

