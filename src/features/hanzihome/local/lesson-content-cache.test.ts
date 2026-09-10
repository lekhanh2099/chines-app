import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";

const storage = new Map<string, unknown>();
const generations = new Map<string, number>();

vi.mock("./content-cache-store", () => ({
 readContentCache: vi.fn(({ ownerId, resourceType, resourceId }) => {
  const key = `${ownerId}:${resourceType}:${resourceId}`;
  return Promise.resolve(storage.get(key) ?? null);
 }),
 writeContentCache: vi.fn(({ ownerId, resourceType, resourceId, data, incomingGeneration }) => {
  const key = `${ownerId}:${resourceType}:${resourceId}`;
  const currentGen = generations.get(key) ?? 0;
  if (incomingGeneration !== undefined && currentGen > incomingGeneration) {
   return Promise.resolve({ written: false, generation: currentGen });
  }
  const nextGen = currentGen + 1;
  generations.set(key, nextGen);
  storage.set(key, data);
  return Promise.resolve({ written: true, generation: nextGen });
 }),
 deleteContentCache: vi.fn((ownerId: string, resourceType: string, resourceId: string) => {
  const key = `${ownerId}:${resourceType}:${resourceId}`;
  storage.delete(key);
  generations.delete(key);
  return Promise.resolve();
 }),
 getContentCacheGeneration: vi.fn((ownerId: string, resourceType: string, resourceId: string) => {
  const key = `${ownerId}:${resourceType}:${resourceId}`;
  return Promise.resolve(generations.get(key) ?? 0);
 }),
 bumpContentCacheGeneration: vi.fn((ownerId: string, resourceType: string, resourceId: string) => {
  const key = `${ownerId}:${resourceType}:${resourceId}`;
  const nextGen = (generations.get(key) ?? 0) + 1;
  generations.set(key, nextGen);
  return Promise.resolve(nextGen);
 }),
 bumpLessonCacheGenerations: vi.fn(() => Promise.resolve()),
}));

const api = vi.hoisted(() => ({
 fetchLessonDetail: vi.fn(),
 fetchLessonVocabulary: vi.fn(),
}));

vi.mock("@/features/hanzihome/repositories/hanzihome-content-api-client", () => ({
 fetchHanziHomeLessonDetail: api.fetchLessonDetail,
 fetchHanziHomeLessonVocabulary: api.fetchLessonVocabulary,
}));

import {
 evictCachedLessonResources,
 getErrorHttpStatus,
 isTransientNetworkError,
 loadLessonDetailWithCache,
 loadLessonVocabularyWithCache,
 readCachedLessonDetail,
 readCachedLessonVocabulary,
 writeCachedLessonDetail,
 writeCachedLessonVocabulary,
} from "./lesson-content-cache";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { LessonVocabularyListResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";

describe("lesson-content-cache", () => {
 beforeEach(() => {
  storage.clear();
  generations.clear();
  vi.clearAllMocks();
 });

 const mockLesson: HanziHomeLesson = {
  id: "lesson-abc",
  lessonNumber: 1,
  titleZh: "第一课",
  title: "Bài 1",
  vocabIds: ["w1"],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
 };

 const mockVocabList: LessonVocabularyListResource = {
  lessonId: "lesson-abc",
  items: [],
  total: 0,
 };

 it("classifies transient network errors and HTTP error statuses correctly", () => {
  expect(isTransientNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  expect(isTransientNetworkError(new DOMException("Request timed out", "TimeoutError"))).toBe(true);
  expect(isTransientNetworkError(new DOMException("The operation was aborted", "AbortError"))).toBe(
   true,
  );
  expect(isTransientNetworkError({ status: 503 })).toBe(true);
  expect(isTransientNetworkError({ status: 504 })).toBe(true);
  expect(isTransientNetworkError({ status: 502 })).toBe(true);
  expect(isTransientNetworkError({ status: 408 })).toBe(true);
  expect(isTransientNetworkError({ status: 404 })).toBe(false);
  expect(isTransientNetworkError({ status: 401 })).toBe(false);
  expect(isTransientNetworkError({ status: 403 })).toBe(false);
  expect(isTransientNetworkError({ status: 412 })).toBe(false);

  expect(getErrorHttpStatus({ status: 404 })).toBe(404);
  expect(getErrorHttpStatus({ status: "403" })).toBe(403);
  expect(getErrorHttpStatus({ status: 401 })).toBe(401);
  expect(getErrorHttpStatus({ status: 412 })).toBe(412);
  expect(getErrorHttpStatus(new Error("Generic"))).toBeNull();
 });

 it("reads and writes cached lesson detail and vocabulary", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);
  const readLesson = await readCachedLessonDetail("user-1", "lesson-abc");
  expect(readLesson).toEqual(mockLesson);

  await writeCachedLessonVocabulary("user-1", "lesson-abc", mockVocabList);
  const readVocab = await readCachedLessonVocabulary("user-1", "lesson-abc");
  expect(readVocab).toEqual(mockVocabList);
 });

 it("evicts cached lesson detail and vocabulary on 404", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);
  await writeCachedLessonVocabulary("user-1", "lesson-abc", mockVocabList);

  await evictCachedLessonResources("user-1", "lesson-abc");

  const readLesson = await readCachedLessonDetail("user-1", "lesson-abc");
  const readVocab = await readCachedLessonVocabulary("user-1", "lesson-abc");

  expect(readLesson).toBeNull();
  expect(readVocab).toBeNull();
 });

 it("loadLessonDetailWithCache fetches remote, writes to cache on success", async () => {
  api.fetchLessonDetail.mockResolvedValueOnce(mockLesson);

  const result = await loadLessonDetailWithCache({
   ownerId: "user-1",
   lessonId: "lesson-abc",
  });

  expect(result).toEqual(mockLesson);
  expect(api.fetchLessonDetail).toHaveBeenCalledWith(
   "lesson-abc",
   expect.objectContaining({ signal: expect.any(Object) }),
  );

  // Stored in cache
  const cached = await readCachedLessonDetail("user-1", "lesson-abc");
  expect(cached).toEqual(mockLesson);
 });

 it("loadLessonDetailWithCache evicts cache on 404 error", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);

  const notFoundError = { status: 404, message: "Lesson not found" };
  api.fetchLessonDetail.mockRejectedValueOnce(notFoundError);

  await expect(
   loadLessonDetailWithCache({
    ownerId: "user-1",
    lessonId: "lesson-abc",
   }),
  ).rejects.toEqual(notFoundError);

  // Cache must be purged
  const cached = await readCachedLessonDetail("user-1", "lesson-abc");
  expect(cached).toBeNull();
 });

 it("loadLessonDetailWithCache handles 401 by clearing memory but preserving isolated cache", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);

  const mockQueryClient: Pick<QueryClient, "removeQueries" | "getQueryData"> = {
   removeQueries: vi.fn(),
   getQueryData: vi.fn(),
  };

  const authError = { status: 401, message: "Unauthorized" };
  api.fetchLessonDetail.mockRejectedValueOnce(authError);

  await expect(
   loadLessonDetailWithCache({
    queryClient: mockQueryClient,
    ownerId: "user-1",
    lessonId: "lesson-abc",
   }),
  ).rejects.toEqual(authError);

  // Clears query from memory
  expect(mockQueryClient.removeQueries).toHaveBeenCalledTimes(1);

  // But preserves isolated cache for same-owner re-auth
  const cached = await readCachedLessonDetail("user-1", "lesson-abc");
  expect(cached).toEqual(mockLesson);
 });

 it("loadLessonDetailWithCache handles 403 by clearing memory AND evicting denied snapshot", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);

  const mockQueryClient: Pick<QueryClient, "removeQueries" | "getQueryData"> = {
   removeQueries: vi.fn(),
   getQueryData: vi.fn(),
  };

  const forbiddenError = { status: 403, message: "Forbidden" };
  api.fetchLessonDetail.mockRejectedValueOnce(forbiddenError);

  await expect(
   loadLessonDetailWithCache({
    queryClient: mockQueryClient,
    ownerId: "user-1",
    lessonId: "lesson-abc",
   }),
  ).rejects.toEqual(forbiddenError);

  // Clears query from memory
  expect(mockQueryClient.removeQueries).toHaveBeenCalledTimes(1);

  // And evicts snapshot from durable cache
  const cached = await readCachedLessonDetail("user-1", "lesson-abc");
  expect(cached).toBeNull();
 });

 it("loadLessonDetailWithCache handles 412 by stopping wrong-owner path immediately", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);

  const preconditionError = { status: 412, message: "Precondition Failed" };
  api.fetchLessonDetail.mockRejectedValueOnce(preconditionError);

  await expect(
   loadLessonDetailWithCache({
    ownerId: "user-1",
    lessonId: "lesson-abc",
   }),
  ).rejects.toEqual(preconditionError);
 });

 it("loadLessonDetailWithCache falls back to local snapshot on transient offline error", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);

  const networkError = new TypeError("Failed to fetch");
  api.fetchLessonDetail.mockRejectedValueOnce(networkError);

  const result = await loadLessonDetailWithCache({
   ownerId: "user-1",
   lessonId: "lesson-abc",
  });

  // Successfully fell back to cached snapshot without crashing
  expect(result).toEqual(mockLesson);
 });

 it("loadLessonVocabularyWithCache falls back to local snapshot on transient offline error", async () => {
  await writeCachedLessonVocabulary("user-1", "lesson-abc", mockVocabList);

  const serverUnavailable = { status: 503, message: "Service Unavailable" };
  api.fetchLessonVocabulary.mockRejectedValueOnce(serverUnavailable);

  const result = await loadLessonVocabularyWithCache({
   ownerId: "user-1",
   lessonId: "lesson-abc",
  });

  expect(result).toEqual(mockVocabList);
 });

 it("prevents stale in-flight GET from resurrecting overwritten lesson data", async () => {
  const v1Lesson: HanziHomeLesson = { ...mockLesson, title: "Bài 1 (v1)" };
  const v2Lesson: HanziHomeLesson = { ...mockLesson, title: "Bài 1 (v2 - Edited)" };

  // 1. Initial write of v1
  await writeCachedLessonDetail("user-1", "lesson-abc", v1Lesson);

  // 2. Slow GET starts with deferred promise
  let resolveGet: (value: HanziHomeLesson) => void = () => {};
  const deferredGet = new Promise<HanziHomeLesson>((resolve) => {
   resolveGet = resolve;
  });
  api.fetchLessonDetail.mockReturnValueOnce(deferredGet);

  const getPromise = loadLessonDetailWithCache({
   ownerId: "user-1",
   lessonId: "lesson-abc",
  });

  // 3. While GET is in-flight, an edit occurs and writes v2 to cache
  await writeCachedLessonDetail("user-1", "lesson-abc", v2Lesson);

  // 4. Slow GET finishes and returns v1
  resolveGet(v1Lesson);
  const getResult = await getPromise;
  expect(getResult).toEqual(v1Lesson);

  // 5. Verify the durable cache retained v2 and was NOT overwritten by late v1 write
  const finalCached = await readCachedLessonDetail("user-1", "lesson-abc");
  expect(finalCached).toEqual(v2Lesson);
 });

 it("loadLessonDetailWithCache falls back to local snapshot on network request timeout", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);

  const timeoutError = new DOMException("Request timed out", "TimeoutError");
  api.fetchLessonDetail.mockRejectedValueOnce(timeoutError);

  const result = await loadLessonDetailWithCache({
   ownerId: "user-1",
   lessonId: "lesson-abc",
  });

  expect(result).toEqual(mockLesson);
 });

 it("loadLessonDetailWithCache terminates hanging request predictably via bounded timeout", async () => {
  await writeCachedLessonDetail("user-1", "lesson-abc", mockLesson);

  api.fetchLessonDetail.mockImplementationOnce(
   (_lessonId: string, options?: { signal?: AbortSignal }) => {
    return new Promise((_resolve, reject) => {
     options?.signal?.addEventListener("abort", () => {
      reject(options.signal?.reason ?? new DOMException("Aborted", "AbortError"));
     });
    });
   },
  );

  const result = await loadLessonDetailWithCache({
   ownerId: "user-1",
   lessonId: "lesson-abc",
   timeoutMs: 25,
  });

  expect(result).toEqual(mockLesson);
 });

 it("loadLessonVocabularyWithCache falls back to local snapshot on network request timeout", async () => {
  await writeCachedLessonVocabulary("user-1", "lesson-abc", mockVocabList);

  const timeoutError = new DOMException("Request timed out", "TimeoutError");
  api.fetchLessonVocabulary.mockRejectedValueOnce(timeoutError);

  const result = await loadLessonVocabularyWithCache({
   ownerId: "user-1",
   lessonId: "lesson-abc",
  });

  expect(result).toEqual(mockVocabList);
 });
});
