"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 downloadCourseOfflinePack,
 evictCourseOfflinePack,
 getCourseOfflineStatus,
 type CourseOfflinePackProgress,
 type CourseOfflineStatus,
 type CourseOfflineStatusResult,
} from "./course-offline-pack.service";

export interface UseCourseOfflinePackOptions {
 courseId: string;
 lessonIds: string[];
}

const defaultStatusResult: CourseOfflineStatusResult = {
 status: "not_cached",
 cachedLessonsCount: 0,
 totalLessonsCount: 0,
};

export function useCourseOfflinePack({ courseId, lessonIds }: UseCourseOfflinePackOptions) {
 const { userId } = useClientSession();
 const queryClient = useQueryClient();
 const t = useTranslations("Common");

 const [isDownloading, setIsDownloading] = useState(false);
 const [progress, setProgress] = useState<CourseOfflinePackProgress | null>(null);

 const queryKey = hanzihomeQueryKeys.courseOfflineStatus(courseId, userId);

 const statusQuery = useQuery({
  queryKey,
  enabled: Boolean(userId && courseId && lessonIds.length > 0),
  queryFn: () => {
   if (!userId || !courseId || lessonIds.length === 0) {
    return Promise.resolve(defaultStatusResult);
   }
   return getCourseOfflineStatus({ courseId, userId, lessonIds });
  },
  staleTime: 30_000,
 });

 const statusResult = statusQuery.data ?? defaultStatusResult;
 const status: CourseOfflineStatus = statusResult.status;
 const cachedLessonsCount = statusResult.cachedLessonsCount;

 const refreshStatus = useCallback(() => {
  return queryClient.invalidateQueries({ queryKey });
 }, [queryClient, queryKey]);

 const download = useCallback(async () => {
  if (!userId || !courseId || lessonIds.length === 0 || isDownloading) return;

  setIsDownloading(true);
  setProgress(null);

  try {
   const result = await downloadCourseOfflinePack({
    courseId,
    userId,
    lessonIds,
    onProgress: (p) => setProgress(p),
   });

   void refreshStatus();

   if (result.success) {
    toast.success(t("offlinePack.downloadReady"));
   } else if (!result.aborted && result.failedCount > 0) {
    toast.error(t("syncStatus.syncError"));
   }
  } catch {
   toast.error(t("syncStatus.syncError"));
  } finally {
   setIsDownloading(false);
   setProgress(null);
  }
 }, [courseId, isDownloading, lessonIds, refreshStatus, t, userId]);

 const evict = useCallback(async () => {
  if (!userId || !courseId || lessonIds.length === 0) return;

  try {
   await evictCourseOfflinePack({ courseId, userId, lessonIds });
   void refreshStatus();
  } catch {
   // Non-fatal
  }
 }, [courseId, lessonIds, refreshStatus, userId]);

 return {
  status,
  cachedLessonsCount,
  totalLessonsCount: lessonIds.length,
  isDownloading,
  progress,
  download,
  evict,
  refreshStatus,
 };
}
