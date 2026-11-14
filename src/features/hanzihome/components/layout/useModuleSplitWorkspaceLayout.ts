"use client";

import { useEffect, useState } from "react";

import type { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import type { useHanziHomeWorkspaceLayout } from "@/features/hanzihome/context/selectors";
import type { StudyModule } from "@/features/hanzihome/context/types";
import { setPaneActive } from "@/features/hanzihome/context/workspaceLayout";

type WorkspaceLayout = ReturnType<typeof useHanziHomeWorkspaceLayout>;

export function useModuleSplitViewport() {
 const [isMobileSplit, setIsMobileSplit] = useState(false);
 const [isHorizontalSplit, setIsHorizontalSplit] = useState(false);

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

 return { isMobileSplit, isHorizontalSplit };
}

export function useModuleSplitActivePaneSync({
 actions,
 activeModule,
 activePane,
 effectiveSplitEnabled,
 paneLayout,
}: {
 actions: ReturnType<typeof useHanziHomeFeatureActions>;
 activeModule: StudyModule;
 activePane: WorkspaceLayout["activePane"];
 effectiveSplitEnabled: boolean;
 paneLayout: WorkspaceLayout["paneLayout"];
}) {
 useEffect(() => {
  if (!effectiveSplitEnabled) return;

  const activePaneModules = activePane === "left" ? paneLayout.left : paneLayout.right;
  if (activePaneModules.includes(activeModule)) {
   const activePaneModule = activePane === "left" ? paneLayout.activeLeft : paneLayout.activeRight;
   if (activePaneModule !== activeModule) {
    actions.setPaneLayout(setPaneActive(paneLayout, activePane, activeModule));
   }
   return;
  }

  const otherPane = activePane === "left" ? "right" : "left";
  const otherPaneModules = otherPane === "left" ? paneLayout.left : paneLayout.right;
  if (otherPaneModules.includes(activeModule)) {
   actions.setActivePane(otherPane);
   const otherPaneModule = otherPane === "left" ? paneLayout.activeLeft : paneLayout.activeRight;
   if (otherPaneModule !== activeModule) {
    actions.setPaneLayout(setPaneActive(paneLayout, otherPane, activeModule));
   }
  }
 }, [actions, activePane, effectiveSplitEnabled, paneLayout, activeModule]);
}
