"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export const HANZIHOME_COMMAND_BAR_WORKSPACE_TARGET_ID = "hanzihome-command-bar-workspace-controls";
export const HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID = "hanzihome-command-bar-module-controls";

function getTarget(targetId: string) {
 if (typeof document === "undefined") return null;
 return document.getElementById(targetId);
}

export function HanziHomeCommandBarPortal({
 targetId,
 children,
 fallback = null,
}: {
 targetId: string;
 children: ReactNode;
 fallback?: ReactNode;
}) {
 const target = getTarget(targetId);

 if (!target) return fallback;

 return createPortal(children, target);
}
