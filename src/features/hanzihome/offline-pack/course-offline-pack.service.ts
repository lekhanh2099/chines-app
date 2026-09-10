import { requestStoragePersistence } from "@/lib/storage/storage-persistence";
import {
 deleteContentCache,
 hasContentCache,
 writeContentCache,
} from "../local/content-cache-store";
import {
 fetchHanziHomeCourseLessons,
 fetchHanziHomeLessonDetail,
 fetchHanziHomeLessonVocabulary,
} from "../repositories/hanzihome-content-api-client";

export interface CourseOfflinePackProgress {
 courseId: string;
 totalLessons: number;
 completedLessons: number;
 percent: number;
 currentLessonTitle?: string;
}

export type CourseOfflineStatus = "fully_cached" | "partially_cached" | "not_cached";

export interface CourseOfflineStatusResult {
 status: CourseOfflineStatus;
 cachedLessonsCount: number;
 totalLessonsCount: number;
}

export interface DownloadCourseOfflinePackParams {
 courseId: string;
 userId: string;
 lessonIds?: string[];
 onProgress?: (progress: CourseOfflinePackProgress) => void;
 signal?: AbortSignal;
}

export interface DownloadCourseOfflinePackResult {
 success: boolean;
 downloadedCount: number;
 skippedCount: number;
 failedCount: number;
 aborted: boolean;
}

const MAX_CONCURRENT_DOWNLOADS = 2;

async function runBoundedPool<T>(
 items: T[],
 concurrencyLimit: number,
 workerFn: (item: T, index: number) => Promise<void>,
 signal?: AbortSignal,
): Promise<void> {
 let currentIndex = 0;

 async function worker(): Promise<void> {
  while (currentIndex < items.length) {
   if (signal?.aborted) {
    return;
   }
   const index = currentIndex;
   currentIndex += 1;
   const item = items[index];
   await workerFn(item, index);
  }
 }

 const workerCount = Math.min(concurrencyLimit, items.length);
 const workers: Promise<void>[] = [];
 for (let i = 0; i < workerCount; i += 1) {
  workers.push(worker());
 }

 await Promise.all(workers);
}

export async function downloadCourseOfflinePack(
 params: DownloadCourseOfflinePackParams,
): Promise<DownloadCourseOfflinePackResult> {
 const { courseId, userId, onProgress, signal } = params;

 if (!courseId || !userId) {
  return {
   success: false,
   downloadedCount: 0,
   skippedCount: 0,
   failedCount: 0,
   aborted: false,
  };
 }

 // Request browser storage persistence so offline content is guarded against eviction
 await requestStoragePersistence().catch(() => {});

 let targetLessonIds = params.lessonIds ?? [];
 let lessonTitlesMap = new Map<string, string>();

 if (!params.lessonIds) {
  try {
   const lessons = await fetchHanziHomeCourseLessons(courseId);
   targetLessonIds = lessons.map((l) => l.id);
   lessonTitlesMap = new Map(lessons.map((l) => [l.id, l.title]));
  } catch {
   return {
    success: false,
    downloadedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    aborted: signal?.aborted ?? false,
   };
  }
 }

 const uniqueLessonIds = Array.from(new Set(targetLessonIds.filter((id) => id.trim().length > 0)));
 const totalLessons = uniqueLessonIds.length;

 if (totalLessons === 0) {
  return {
   success: true,
   downloadedCount: 0,
   skippedCount: 0,
   failedCount: 0,
   aborted: false,
  };
 }

 let completedLessons = 0;
 let downloadedCount = 0;
 let skippedCount = 0;
 let failedCount = 0;

 function reportProgress(currentLessonTitle?: string) {
  if (!onProgress) return;
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 100;
  onProgress({
   courseId,
   totalLessons,
   completedLessons,
   percent,
   currentLessonTitle,
  });
 }

 reportProgress();

 await runBoundedPool(
  uniqueLessonIds,
  MAX_CONCURRENT_DOWNLOADS,
  async (lessonId: string) => {
   if (signal?.aborted) return;

   const title = lessonTitlesMap.get(lessonId);

   try {
    const [hasDetail, hasVocab] = await Promise.all([
     hasContentCache(userId, "lesson_detail", lessonId),
     hasContentCache(userId, "lesson_vocab", lessonId),
    ]);

    if (hasDetail && hasVocab) {
     skippedCount += 1;
     completedLessons += 1;
     reportProgress(title);
     return;
    }

    const [detail, vocab] = await Promise.all([
     hasDetail ? null : fetchHanziHomeLessonDetail(lessonId, { signal }),
     hasVocab ? null : fetchHanziHomeLessonVocabulary(lessonId, { signal }),
    ]);

    if (signal?.aborted) return;

    if (detail) {
     await writeContentCache({
      ownerId: userId,
      resourceType: "lesson_detail",
      resourceId: lessonId,
      data: detail,
     });
    }

    if (vocab) {
     await writeContentCache({
      ownerId: userId,
      resourceType: "lesson_vocab",
      resourceId: lessonId,
      data: vocab,
     });
    }

    downloadedCount += 1;
    completedLessons += 1;
    reportProgress(title);
   } catch {
    if (signal?.aborted) return;
    failedCount += 1;
    completedLessons += 1;
    reportProgress(title);
   }
  },
  signal,
 );

 const isAborted = signal?.aborted ?? false;

 return {
  success: !isAborted && failedCount === 0,
  downloadedCount,
  skippedCount,
  failedCount,
  aborted: isAborted,
 };
}

export async function getCourseOfflineStatus(params: {
 courseId: string;
 userId: string;
 lessonIds: string[];
}): Promise<CourseOfflineStatusResult> {
 const { userId, lessonIds } = params;
 const uniqueLessonIds = Array.from(new Set(lessonIds.filter((id) => id.trim().length > 0)));
 const totalLessonsCount = uniqueLessonIds.length;

 if (totalLessonsCount === 0) {
  return {
   status: "not_cached",
   cachedLessonsCount: 0,
   totalLessonsCount: 0,
  };
 }

 let cachedLessonsCount = 0;

 for (const lessonId of uniqueLessonIds) {
  const [hasDetail, hasVocab] = await Promise.all([
   hasContentCache(userId, "lesson_detail", lessonId),
   hasContentCache(userId, "lesson_vocab", lessonId),
  ]);

  if (hasDetail && hasVocab) {
   cachedLessonsCount += 1;
  }
 }

 let status: CourseOfflineStatus = "not_cached";
 if (cachedLessonsCount === totalLessonsCount) {
  status = "fully_cached";
 } else if (cachedLessonsCount > 0) {
  status = "partially_cached";
 }

 return {
  status,
  cachedLessonsCount,
  totalLessonsCount,
 };
}

export async function evictCourseOfflinePack(params: {
 courseId: string;
 userId: string;
 lessonIds: string[];
}): Promise<void> {
 const { userId, lessonIds } = params;
 const uniqueLessonIds = Array.from(new Set(lessonIds.filter((id) => id.trim().length > 0)));

 for (const lessonId of uniqueLessonIds) {
  await Promise.all([
   deleteContentCache(userId, "lesson_detail", lessonId).catch(() => {}),
   deleteContentCache(userId, "lesson_vocab", lessonId).catch(() => {}),
  ]);
 }
}
