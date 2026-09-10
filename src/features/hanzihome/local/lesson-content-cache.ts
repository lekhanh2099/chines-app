"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
 lessonSchema,
 lessonVocabularyApiResponseSchema,
} from "@/features/hanzihome/hanzihome-api.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { LessonVocabularyListResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 fetchHanziHomeLessonDetail,
 fetchHanziHomeLessonVocabulary,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 deleteContentCache,
 getContentCacheGeneration,
 readContentCache,
 writeContentCache,
} from "./content-cache-store";

export const LESSON_DETAIL_RESOURCE_TYPE = "lesson_detail";
export const LESSON_VOCAB_RESOURCE_TYPE = "lesson_vocab";

const lessonVocabularyResourceSchema = lessonVocabularyApiResponseSchema.shape.resource;

export async function readCachedLessonDetail(
 ownerId: string,
 lessonId: string,
): Promise<HanziHomeLesson | null> {
 if (!ownerId || !lessonId) return null;
 return readContentCache({
  ownerId,
  resourceType: LESSON_DETAIL_RESOURCE_TYPE,
  resourceId: lessonId,
  schema: lessonSchema,
 });
}

export async function writeCachedLessonDetail(
 ownerId: string,
 lessonId: string,
 lesson: HanziHomeLesson,
 incomingGeneration?: number,
): Promise<{ written: boolean; generation: number }> {
 if (!ownerId || !lessonId || !lesson) return { written: false, generation: 0 };
 return writeContentCache({
  ownerId,
  resourceType: LESSON_DETAIL_RESOURCE_TYPE,
  resourceId: lessonId,
  data: lesson,
  incomingGeneration,
 });
}

export async function readCachedLessonVocabulary(
 ownerId: string,
 lessonId: string,
): Promise<LessonVocabularyListResource | null> {
 if (!ownerId || !lessonId) return null;
 return readContentCache({
  ownerId,
  resourceType: LESSON_VOCAB_RESOURCE_TYPE,
  resourceId: lessonId,
  schema: lessonVocabularyResourceSchema,
 });
}

export async function writeCachedLessonVocabulary(
 ownerId: string,
 lessonId: string,
 resource: LessonVocabularyListResource,
 incomingGeneration?: number,
): Promise<{ written: boolean; generation: number }> {
 if (!ownerId || !lessonId || !resource) return { written: false, generation: 0 };
 return writeContentCache({
  ownerId,
  resourceType: LESSON_VOCAB_RESOURCE_TYPE,
  resourceId: lessonId,
  data: resource,
  incomingGeneration,
 });
}

export async function evictCachedLessonResources(ownerId: string, lessonId: string): Promise<void> {
 if (!ownerId || !lessonId) return;
 await Promise.all([
  deleteContentCache(ownerId, LESSON_DETAIL_RESOURCE_TYPE, lessonId).catch(() => {}),
  deleteContentCache(ownerId, LESSON_VOCAB_RESOURCE_TYPE, lessonId).catch(() => {}),
 ]);
}

export function isTransientNetworkError(error: unknown): boolean {
 const status = getErrorHttpStatus(error);
 if (status === 401 || status === 403 || status === 404 || status === 412) {
  return false;
 }

 if (
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  navigator.onLine === false
 ) {
  return true;
 }
 if (error instanceof TypeError) {
  return true;
 }
 if (error && typeof error === "object") {
  if ("name" in error && (error.name === "AbortError" || error.name === "TimeoutError")) {
   return true;
  }
  if ("status" in error) {
   const errStatus = Number(error.status);
   return errStatus === 503 || errStatus === 504 || errStatus === 502 || errStatus === 408;
  }
 }
 return false;
}

export function getErrorHttpStatus(error: unknown): number | null {
 if (error && typeof error === "object" && "status" in error) {
  const status = Number(error.status);
  if (Number.isInteger(status) && status > 0) return status;
 }
 return null;
}

export const DEFAULT_CONTENT_READ_TIMEOUT_MS = 8000;

export function createBoundedTimeoutSignal(
 callerSignal?: AbortSignal,
 timeoutMs: number = DEFAULT_CONTENT_READ_TIMEOUT_MS,
): { signal: AbortSignal; cleanup: () => void } {
 const controller = new AbortController();

 let timerId: ReturnType<typeof setTimeout> | null = null;
 if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
  timerId = setTimeout(() => {
   controller.abort(new DOMException("Request timed out", "TimeoutError"));
  }, timeoutMs);
 }

 const onCallerAbort = () => {
  controller.abort(callerSignal?.reason);
 };

 if (callerSignal) {
  if (callerSignal.aborted) {
   controller.abort(callerSignal.reason);
  } else {
   callerSignal.addEventListener("abort", onCallerAbort, { once: true });
  }
 }

 const cleanup = () => {
  if (timerId !== null) {
   clearTimeout(timerId);
  }
  if (callerSignal) {
   callerSignal.removeEventListener("abort", onCallerAbort);
  }
 };

 return { signal: controller.signal, cleanup };
}

export async function loadLessonDetailWithCache(params: {
 queryClient?: Pick<QueryClient, "removeQueries" | "getQueryData">;
 ownerId: string;
 lessonId: string;
 signal?: AbortSignal;
 timeoutMs?: number;
}): Promise<HanziHomeLesson | null> {
 const { queryClient, ownerId, lessonId, signal: callerSignal, timeoutMs } = params;
 const queryKey = hanzihomeQueryKeys.lessonDetail(lessonId);

 const startGeneration = await getContentCacheGeneration(
  ownerId,
  LESSON_DETAIL_RESOURCE_TYPE,
  lessonId,
 );

 const { signal, cleanup } = createBoundedTimeoutSignal(callerSignal, timeoutMs);

 try {
  const remote = await fetchHanziHomeLessonDetail(lessonId, { signal });
  if (remote) {
   void writeCachedLessonDetail(ownerId, lessonId, remote, startGeneration);
  }
  return remote;
 } catch (error) {
  const status = getErrorHttpStatus(error);
  if (status === 404) {
   void evictCachedLessonResources(ownerId, lessonId);
   throw error;
  }
  if (status === 403) {
   if (queryClient) {
    queryClient.removeQueries({ queryKey, exact: true });
   }
   void evictCachedLessonResources(ownerId, lessonId);
   throw error;
  }
  if (status === 401) {
   if (queryClient) {
    queryClient.removeQueries({ queryKey, exact: true });
   }
   // Block private fallback, keep isolated cache for same-owner re-auth
   throw error;
  }
  if (status === 412) {
   // Stop wrong-owner path immediately
   throw error;
  }
  if (isTransientNetworkError(error)) {
   if (queryClient) {
    const inMemory = queryClient.getQueryData<HanziHomeLesson | null>(queryKey);
    if (inMemory) return inMemory;
   }
   const localSnapshot = await readCachedLessonDetail(ownerId, lessonId);
   if (localSnapshot) return localSnapshot;
  }
  throw error;
 } finally {
  cleanup();
 }
}

export async function loadLessonVocabularyWithCache(params: {
 queryClient?: Pick<QueryClient, "removeQueries" | "getQueryData">;
 ownerId: string;
 lessonId: string;
 signal?: AbortSignal;
 timeoutMs?: number;
}): Promise<LessonVocabularyListResource | null> {
 const { queryClient, ownerId, lessonId, signal: callerSignal, timeoutMs } = params;
 const queryKey = hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary");

 const startGeneration = await getContentCacheGeneration(
  ownerId,
  LESSON_VOCAB_RESOURCE_TYPE,
  lessonId,
 );

 const { signal, cleanup } = createBoundedTimeoutSignal(callerSignal, timeoutMs);

 try {
  const remote = await fetchHanziHomeLessonVocabulary(lessonId, { signal });
  if (remote) {
   void writeCachedLessonVocabulary(ownerId, lessonId, remote, startGeneration);
  }
  return remote;
 } catch (error) {
  const status = getErrorHttpStatus(error);
  if (status === 404) {
   void evictCachedLessonResources(ownerId, lessonId);
   throw error;
  }
  if (status === 403) {
   if (queryClient) {
    queryClient.removeQueries({ queryKey, exact: true });
   }
   void evictCachedLessonResources(ownerId, lessonId);
   throw error;
  }
  if (status === 401) {
   if (queryClient) {
    queryClient.removeQueries({ queryKey, exact: true });
   }
   // Block private fallback, keep isolated cache for same-owner re-auth
   throw error;
  }
  if (status === 412) {
   // Stop wrong-owner path immediately
   throw error;
  }
  if (isTransientNetworkError(error)) {
   if (queryClient) {
    const inMemory = queryClient.getQueryData<LessonVocabularyListResource | null>(queryKey);
    if (inMemory) return inMemory;
   }
   const localSnapshot = await readCachedLessonVocabulary(ownerId, lessonId);
   if (localSnapshot) return localSnapshot;
  }
  throw error;
 } finally {
  cleanup();
 }
}
