"use client";

import { AlertTriangle, CloudOff, RefreshCcw, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

export function LearningSyncStatus() {
 const tSync = useTranslations("Common.syncStatus");
 const runtime = useHanziHomeRuntime();
 const sync = runtime.learningSync;

 if (!sync) return null;

 if (sync.durability === "failed") {
  return (
   <div className="flex shrink-0 items-center gap-1">
    <Badge variant="danger" size="md" title={sync.lastError || tSync("localStorageFailed")}>
     <AlertTriangle className="h-3.5 w-3.5" />
     <span className="hidden sm:inline">{tSync("localStorageFailed")}</span>
     <span className="sm:hidden">{tSync("localStorageFailed")}</span>
    </Badge>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={tSync("retry")}
     title={tSync("retry")}
     onClick={() => {
      void sync.retry();
     }}
    >
     <RefreshCcw className="h-3.5 w-3.5" />
    </Button>
   </div>
  );
 }

 if (sync.durability === "memory-only") {
  return (
   <Badge variant="default" size="md">
    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
    <span className="hidden sm:inline">{tSync("localSavePending")}</span>
    <span className="sm:hidden">...</span>
   </Badge>
  );
 }

 const hasOfflinePendingWrites =
  !sync.isOnline &&
  (sync.durability === undefined || sync.durability === "durable") &&
  sync.pendingCount > 0;
 if (hasOfflinePendingWrites) {
  return (
   <Badge variant="warning" size="md">
    <WifiOff className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">{tSync("durablySavedOffline")}</span>
    <span className="sm:hidden">{tSync("offline")}</span>
   </Badge>
  );
 }

 if (sync.isOnline && sync.status === "syncing") {
  return (
   <Badge variant="default" size="md">
    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
    <span className="hidden sm:inline">{tSync("syncing")}</span>
    <span className="sm:hidden">...</span>
   </Badge>
  );
 }

 if (sync.status === "error") {
  return (
   <div className="flex shrink-0 items-center gap-1">
    <Badge variant="danger" size="md" title={sync.lastError || tSync("syncError")}>
     <CloudOff className="h-3.5 w-3.5" />
     <span className="hidden sm:inline">{tSync("syncError")}</span>
     <span className="sm:hidden">{tSync("syncError")}</span>
    </Badge>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={tSync("retry")}
     title={tSync("retry")}
     onClick={() => {
      void sync.retry();
     }}
    >
     <RefreshCcw className="h-3.5 w-3.5" />
    </Button>
   </div>
  );
 }

 return null;
}
