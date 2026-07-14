"use client";

import { type ReactNode, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export const HANZIHOME_COMMAND_BAR_WORKSPACE_TARGET_ID = "hanzihome-command-bar-workspace-controls";
export const HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID = "hanzihome-command-bar-module-controls";
export const HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID = "hanzihome-command-bar-tools-menu";

export function HanziHomeCommandBarPortal({
 targetId,
 children,
 fallback = null,
}: {
 targetId: string;
 children: ReactNode;
 fallback?: ReactNode;
}) {
 const subscribe = useCallback((onStoreChange: () => void) => {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
 }, []);
 const getSnapshot = useCallback(() => document.getElementById(targetId), [targetId]);
 const target = useSyncExternalStore(subscribe, getSnapshot, () => null);

 if (!target) return fallback;

 return createPortal(children, target);
}
