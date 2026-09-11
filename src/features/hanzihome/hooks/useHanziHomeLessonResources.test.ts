import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
 readCachedLessonDetail: vi.fn(),
 readCachedLessonVocabulary: vi.fn(),
 loadLessonDetailWithCache: vi.fn(),
 loadLessonVocabularyWithCache: vi.fn(),
}));

vi.mock("@/features/hanzihome/local/lesson-content-cache", () => ({
 readCachedLessonDetail: cacheMocks.readCachedLessonDetail,
 readCachedLessonVocabulary: cacheMocks.readCachedLessonVocabulary,
 loadLessonDetailWithCache: cacheMocks.loadLessonDetailWithCache,
 loadLessonVocabularyWithCache: cacheMocks.loadLessonVocabularyWithCache,
 getErrorHttpStatus: () => 500,
}));

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({
  user: { id: "user-123" },
  isResolved: true,
 }),
}));

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 hydrateCachedLessonDetail,
 hydrateCachedLessonVocabulary,
 lessonResourceStaleTime,
} from "./useHanziHomeLessonResources";

describe("A5 — Hydration Freshness and Offline Fallback Revalidation", () => {
 let queryClient: QueryClient;

 beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
   defaultOptions: { queries: { retry: false } },
  });
 });

 afterEach(() => {
  queryClient.clear();
 });

 it("Invariant: lessonResourceStaleTime is finite to prevent indefinite freshness lock", () => {
  expect(lessonResourceStaleTime).toBeLessThan(Infinity);
  expect(lessonResourceStaleTime).toBe(5 * 60 * 1000);
 });

 it("Invariant: Hydrated offline detail snapshot has updatedAt: 0 and is immediately stale", async () => {
  const cachedDetail = {
   id: "lesson-1",
   title: "Cached Offline Lesson",
   sections: [],
  };
  cacheMocks.readCachedLessonDetail.mockResolvedValue(cachedDetail);

  const hydrated = await hydrateCachedLessonDetail(queryClient, "user-123", "lesson-1");
  expect(hydrated).toBe(true);

  const queryKey = hanzihomeQueryKeys.lessonDetail("lesson-1");
  const state = queryClient.getQueryState(queryKey);

  expect(state).toBeDefined();
  expect(state?.data).toEqual(cachedDetail);
  // Crucial A5 invariant: dataUpdatedAt must be 0, marking it stale immediately for background revalidation
  expect(state?.dataUpdatedAt).toBe(0);
  expect(
   queryClient.getQueryCache().find({ queryKey })?.isStaleByTime(lessonResourceStaleTime),
  ).toBe(true);
 });

 it("Invariant: Hydrated offline vocabulary snapshot has updatedAt: 0 and is immediately stale", async () => {
  const cachedVocab = {
   lessonId: "lesson-1",
   items: [{ id: "v-1", word: "你好" }],
  };
  cacheMocks.readCachedLessonVocabulary.mockResolvedValue(cachedVocab);

  const hydrated = await hydrateCachedLessonVocabulary(queryClient, "user-123", "lesson-1");
  expect(hydrated).toBe(true);

  const queryKey = hanzihomeQueryKeys.lessonResource("lesson-1", "vocabulary");
  const state = queryClient.getQueryState(queryKey);

  expect(state).toBeDefined();
  expect(state?.data).toEqual(cachedVocab);
  expect(state?.dataUpdatedAt).toBe(0);
  expect(
   queryClient.getQueryCache().find({ queryKey })?.isStaleByTime(lessonResourceStaleTime),
  ).toBe(true);
 });
});
