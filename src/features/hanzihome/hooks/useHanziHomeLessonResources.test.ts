import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { useClientSession } from "@/components/providers/QueryProvider";
import type {
 loadLessonDetailWithCache,
 loadLessonVocabularyWithCache,
} from "@/features/hanzihome/local/lesson-content-cache";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
 readCachedLessonDetail: vi.fn(),
 readCachedLessonVocabulary: vi.fn(),
 loadLessonDetailWithCache: vi.fn<typeof loadLessonDetailWithCache>(),
 loadLessonVocabularyWithCache: vi.fn<typeof loadLessonVocabularyWithCache>(),
}));

vi.mock("@/features/hanzihome/local/lesson-content-cache", () => ({
 readCachedLessonDetail: cacheMocks.readCachedLessonDetail,
 readCachedLessonVocabulary: cacheMocks.readCachedLessonVocabulary,
 loadLessonDetailWithCache: cacheMocks.loadLessonDetailWithCache,
 loadLessonVocabularyWithCache: cacheMocks.loadLessonVocabularyWithCache,
 getErrorHttpStatus: () => 500,
}));

const session: Pick<ReturnType<typeof useClientSession>, "userId"> = { userId: "user-123" };
const prefetchRoute = vi.fn<Parameters<typeof usePrefetchHanziHomeLesson>[0]>();

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({
  user: { id: "user-123" },
  userId: session.userId,
  isResolved: true,
 }),
}));

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 hydrateCachedLessonDetail,
 hydrateCachedLessonVocabulary,
 lessonResourceStaleTime,
 usePrefetchHanziHomeLesson,
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

describe("lesson prefetch command", () => {
 let client: QueryClient;
 beforeEach(() => {
  vi.clearAllMocks();
  session.userId = "user-123";
  cacheMocks.loadLessonDetailWithCache.mockResolvedValue(null);
  cacheMocks.loadLessonVocabularyWithCache.mockResolvedValue(null);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 });
 afterEach(() => client.clear());
 function command() {
  const captures: ReturnType<typeof usePrefetchHanziHomeLesson>[] = [];
  function Probe() {
   captures.push(usePrefetchHanziHomeLesson(prefetchRoute));
   return null;
  }
  renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
  const prefetch = captures[0];
  if (!prefetch) throw new Error("Missing prefetch command");
  return prefetch;
 }
 async function settled(id: string) {
  await vi.waitFor(() => {
   expect(client.getQueryState(hanzihomeQueryKeys.lessonDetail(id))?.fetchStatus).toBe("idle");
   expect(
    client.getQueryState(hanzihomeQueryKeys.lessonResource(id, "vocabulary"))?.fetchStatus,
   ).toBe("idle");
  });
 }
 it("does not request an empty target", () => {
  command()("", "/hanzihome?courseId=a");
  expect(prefetchRoute).not.toHaveBeenCalled();
  expect(cacheMocks.loadLessonDetailWithCache).not.toHaveBeenCalled();
  expect(cacheMocks.loadLessonVocabularyWithCache).not.toHaveBeenCalled();
 });
 it("prefetches the matching route and both resources under the captured owner, deduplicating pending and fresh data", async () => {
  let finish = () => {};
  cacheMocks.loadLessonDetailWithCache.mockImplementation(
   () =>
    new Promise((resolve) => {
     finish = () => resolve(null);
    }),
  );
  const prefetch = command();
  prefetch("lesson-2", "/hanzihome?courseId=a&lesson=2");
  prefetch("lesson-2", "/hanzihome?courseId=a&lesson=2");
  expect(cacheMocks.loadLessonDetailWithCache).toHaveBeenCalledTimes(1);
  expect(cacheMocks.loadLessonVocabularyWithCache).toHaveBeenCalledTimes(1);
  session.userId = "owner-b";
  expect(cacheMocks.loadLessonDetailWithCache).toHaveBeenCalledWith(
   expect.objectContaining({ ownerId: "user-123", lessonId: "lesson-2", queryClient: client }),
  );
  finish();
  await settled("lesson-2");
  prefetch("lesson-2", "/hanzihome?courseId=a&lesson=2");
  await settled("lesson-2");
  expect(cacheMocks.loadLessonDetailWithCache).toHaveBeenCalledTimes(1);
  expect(cacheMocks.loadLessonVocabularyWithCache).toHaveBeenCalledTimes(1);
  expect(prefetchRoute).toHaveBeenLastCalledWith("/hanzihome?courseId=a&lesson=2");
 });
 it("refreshes stale resources and retains the existing anonymous fallback", async () => {
  session.userId = "";
  client.setQueryData(hanzihomeQueryKeys.lessonDetail("lesson"), null, {
   updatedAt: Date.now() - lessonResourceStaleTime - 1,
  });
  client.setQueryData(hanzihomeQueryKeys.lessonResource("lesson", "vocabulary"), null, {
   updatedAt: Date.now() - lessonResourceStaleTime - 1,
  });
  command()("lesson", "/hanzihome?courseId=a&lesson=1");
  await settled("lesson");
  expect(cacheMocks.loadLessonDetailWithCache).toHaveBeenCalledWith(
   expect.objectContaining({ ownerId: "anonymous", lessonId: "lesson" }),
  );
  expect(cacheMocks.loadLessonVocabularyWithCache).toHaveBeenCalledWith(
   expect.objectContaining({ ownerId: "anonymous", lessonId: "lesson" }),
  );
 });
 it("retains a failed resource status and permits an explicit next prefetch", async () => {
  cacheMocks.loadLessonDetailWithCache.mockRejectedValueOnce(new Error("Detail failed"));
  const prefetch = command();
  prefetch("lesson", "/hanzihome?courseId=a&lesson=1");
  await settled("lesson");
  expect(client.getQueryState(hanzihomeQueryKeys.lessonDetail("lesson"))?.status).toBe("error");
  expect(
   client.getQueryState(hanzihomeQueryKeys.lessonResource("lesson", "vocabulary"))?.status,
  ).toBe("success");
  prefetch("lesson", "/hanzihome?courseId=a&lesson=1");
  await settled("lesson");
  expect(client.getQueryState(hanzihomeQueryKeys.lessonDetail("lesson"))?.status).toBe("success");
  expect(cacheMocks.loadLessonDetailWithCache).toHaveBeenCalledTimes(2);
  expect(cacheMocks.loadLessonVocabularyWithCache).toHaveBeenCalledTimes(1);
 });
});
