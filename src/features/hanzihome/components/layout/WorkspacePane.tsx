"use client";

import { useState } from "react";

import { LessonModuleContent } from "@/features/hanzihome/components/modules/LessonModuleContent";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import { useHanziHomeWorkspaceLayout } from "@/features/hanzihome/context/selectors";
import type { PaneId, StudyModule } from "@/features/hanzihome/context/types";
import { moveModuleInLayout, setPaneActive } from "@/features/hanzihome/context/workspaceLayout";

import { ModulePane } from "./ModulePane";
import { tabsForLesson } from "./moduleMeta";

export function WorkspacePane({ paneId, className }: { paneId: PaneId; className?: string }) {
 const runtime = useHanziHomeRuntime();
 const { paneLayout, draggedModule } = useHanziHomeWorkspaceLayout();
 const actions = useHanziHomeFeatureActions();
 const initialLessonTextSelectedSectionId = useHanziHomeFeatureSelector(
  (state) => state.lessonTextSelectedSectionId,
 );
 const [lessonTextSelectedSectionId, setLessonTextSelectedSectionId] = useState(
  initialLessonTextSelectedSectionId,
 );
 const items = paneId === "left" ? paneLayout.left : paneLayout.right;
 const activeModule = paneId === "left" ? paneLayout.activeLeft : paneLayout.activeRight;
 const availableModules = tabsForLesson(runtime.lesson).map((item) => item.key);

 const selectModule = (module: StudyModule) => {
  if (items.includes(module)) {
   actions.setPaneLayout(setPaneActive(paneLayout, paneId, module));
  } else {
   const sourcePane = paneLayout.left.includes(module) ? "left" : "right";
   actions.setPaneLayout(moveModuleInLayout(paneLayout, module, sourcePane, paneId, items.length));
  }
  actions.setActivePane(paneId);
  runtime.selectModule(module);
 };

 const moveModule = (
  module: StudyModule,
  sourcePane: PaneId,
  targetPane: PaneId,
  targetIndex: number,
 ) => {
  actions.setPaneLayout(
   moveModuleInLayout(paneLayout, module, sourcePane, targetPane, targetIndex),
  );
  actions.setActivePane(targetPane);
  runtime.selectModule(module);
 };

 return (
  <ModulePane
   items={items}
   availableModules={availableModules}
   activeModule={activeModule}
   paneId={paneId}
   draggedModule={draggedModule}
   className={className}
   onDragStart={actions.setDraggedModule}
   onDragEnd={() => actions.setDraggedModule(null)}
   onMoveModule={moveModule}
   onSelectModule={selectModule}
  >
   <LessonModuleContent
    module={activeModule}
    compact
    lessonTextSelectedSectionId={lessonTextSelectedSectionId}
    onSelectLessonTextSection={setLessonTextSelectedSectionId}
   />
  </ModulePane>
 );
}
