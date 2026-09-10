"use client";

import { CloudCheck, Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useCourseOfflinePack } from "./useCourseOfflinePack";

export function CourseOfflineDownloadButton({
 courseId,
 lessonIds,
}: {
 courseId: string;
 lessonIds: string[];
}) {
 const t = useTranslations("Common");
 const { status, isDownloading, progress, download } = useCourseOfflinePack({
  courseId,
  lessonIds,
 });

 if (lessonIds.length === 0) return null;

 if (isDownloading) {
  const percent = progress?.percent ?? 0;
  return (
   <Button
    type="button"
    size="toolbar"
    variant="ghost"
    disabled
    aria-label={t("offlinePack.downloading", { percent })}
    className="shrink-0 gap-1"
   >
    <Loader2 className="animate-spin" data-icon="inline-start" />
    <span>{percent}%</span>
   </Button>
  );
 }

 if (status === "fully_cached") {
  return (
   <Tooltip>
    <TooltipTrigger asChild>
     <Badge variant="success" size="sm" className="shrink-0 cursor-default gap-1">
      <CloudCheck data-icon="inline-start" />
      <span className="sr-only">{t("offlinePack.downloadReady")}</span>
     </Badge>
    </TooltipTrigger>
    <TooltipContent side="top">{t("offlinePack.downloadReady")}</TooltipContent>
   </Tooltip>
  );
 }

 return (
  <Tooltip>
   <TooltipTrigger asChild>
    <Button
     type="button"
     size="toolbar"
     variant="ghost"
     onClick={() => void download()}
     aria-label={t("offlinePack.downloadCourse")}
     className="shrink-0"
    >
     <Download data-icon="inline-start" />
     <span className="sr-only">{t("offlinePack.downloadCourse")}</span>
    </Button>
   </TooltipTrigger>
   <TooltipContent side="top">{t("offlinePack.downloadCourse")}</TooltipContent>
  </Tooltip>
 );
}
