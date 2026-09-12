import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localFirst = vi.hoisted(() => ({
 load: vi.fn(),
 save: vi.fn(),
 sync: vi.fn(),
 refresh: vi.fn(),
}));

const outbox = vi.hoisted(() => ({
 enqueue: vi.fn(),
 sync: vi.fn(),
}));

vi.mock("@/features/hanzihome/local/learning-state-local-first", () => ({
 loadLearningStateLocalFirst: localFirst.load,
 saveLearningStateLocalFirst: localFirst.save,
 syncPendingLearningStateMutations: localFirst.sync,
 refreshLearningStateFromRemoteIfClean: localFirst.refresh,
}));

vi.mock("@/features/hanzihome/local/review-attempt-outbox", () => ({
 enqueueReviewAttempt: outbox.enqueue,
 syncPendingReviewAttempts: outbox.sync,
}));

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({
  userId: "test-user-123",
  isResolved: true,
 }),
}));

import { getLearningStateSyncState, useLearningState } from "./useLearningState";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

describe("A2 — Learning/Review Durability and Retry Intent Recovery", () => {
 let queryClient: QueryClient;

 beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({
   defaultOptions: { queries: { retry: false } },
  });
  localFirst.load.mockResolvedValue(normalizeLearningState(emptyLearningState));
  localFirst.sync.mockResolvedValue({
   status: "synced",
   syncedCount: 1,
   pendingCount: 0,
  });
  outbox.sync.mockResolvedValue({
   status: "synced",
   syncedCount: 1,
   pendingCount: 0,
  });
 });

 afterEach(() => {
  queryClient.clear();
 });

 it("Invariant: When local IndexedDB save fails, intent is preserved and retrySync recovers persistence", async () => {
  // First save fails due to storage error (e.g. quota, transaction aborted)
  localFirst.save.mockRejectedValueOnce(new Error("IndexedDB quota exceeded"));

  let hookResult: ReturnType<typeof useLearningState> | undefined;
  function TestComponent() {
   hookResult = useLearningState();
   return null;
  }

  renderToStaticMarkup(
   createElement(QueryClientProvider, { client: queryClient }, createElement(TestComponent)),
  );

  expect(hookResult).toBeDefined();
  if (!hookResult) throw new Error("hookResult was not captured");

  // Trigger state update via recordReview (vocab item)
  hookResult.recordReview(
   {
    type: "vocab",
    id: "char-1",
    label: "字",
   },
   "known",
  );

  // Allow in-flight chain to reject
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Verify save was attempted and failed
  expect(localFirst.save).toHaveBeenCalledTimes(1);
  expect(getLearningStateSyncState("test-user-123").durability).toBe("failed");
  expect(getLearningStateSyncState("test-user-123").status).toBe("error");

  // Storage recovers: next save will succeed
  localFirst.save.mockResolvedValueOnce(undefined);

  // User clicks "Retry"
  const retryResult = await hookResult.retrySync();

  // Verify that save was retried with the original intent and attemptId!
  expect(localFirst.save).toHaveBeenCalledTimes(2);
  expect(localFirst.save).toHaveBeenLastCalledWith(
   "test-user-123",
   expect.any(Object),
   expect.objectContaining({
    progress: expect.objectContaining({
     vocab: expect.objectContaining({ "char-1": expect.any(Object) }),
    }),
   }),
   {
    reviewAttempt: {
     attemptId: expect.any(String),
     input: expect.objectContaining({ itemId: "char-1", result: "known" }),
    },
   },
  );

  // Durability recovers to durable and remote sync succeeds
  expect(retryResult.status).toBe("synced");
  expect(getLearningStateSyncState("test-user-123").durability).toBe("durable");
 });

 it("Invariant: Review evidence enqueue failure is preserved and retrySync recovers outbox enqueue", async () => {
  outbox.enqueue.mockRejectedValueOnce(new Error("Storage locked"));

  let hookResult: ReturnType<typeof useLearningState> | undefined;
  function TestComponent() {
   hookResult = useLearningState();
   return null;
  }

  renderToStaticMarkup(
   createElement(QueryClientProvider, { client: queryClient }, createElement(TestComponent)),
  );

  expect(hookResult).toBeDefined();
  if (!hookResult) throw new Error("hookResult was not captured");

  // Radicals queue review evidence via outbox
  hookResult.recordReview({ type: "radical", id: "rad-1", label: "水" }, "known");

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(outbox.enqueue).toHaveBeenCalledTimes(1);
  expect(getLearningStateSyncState("test-user-123").durability).toBe("failed");

  // Storage recovers
  outbox.enqueue.mockResolvedValueOnce(undefined);

  // Retry
  const retryResult = await hookResult.retrySync();

  expect(outbox.enqueue).toHaveBeenCalledTimes(2);
  expect(outbox.enqueue).toHaveBeenLastCalledWith(
   "test-user-123",
   expect.objectContaining({ itemId: "rad-1", result: "known" }),
   expect.any(String),
  );
  expect(retryResult.status).toBe("synced");
  expect(getLearningStateSyncState("test-user-123").durability).toBe("durable");
 });

 it("A2 Invariant: retries failed intents in order without letting the first stale state erase the second", async () => {
  localFirst.save.mockRejectedValue(new Error("Storage unavailable"));
  let retry = () => Promise.resolve();
  function Actions() {
   const learning = useLearningState();
   retry = async () => {
    await learning.retrySync();
   };
   learning.recordReview({ type: "vocab", id: "retry-a", label: "甲" }, "known");
   learning.recordReview({ type: "vocab", id: "retry-b", label: "乙" }, "hard");
   return null;
  }
  renderToStaticMarkup(
   createElement(QueryClientProvider, { client: queryClient }, createElement(Actions)),
  );
  await vi.waitFor(() => expect(localFirst.save).toHaveBeenCalledTimes(2));
  await retry();
  expect(localFirst.save).toHaveBeenCalledTimes(3);
  localFirst.save.mockResolvedValue(undefined);
  await retry();
  expect(localFirst.save).toHaveBeenCalledTimes(5);
  const retriedA = localFirst.save.mock.calls[3];
  const retriedB = localFirst.save.mock.calls[4];
  expect(retriedA?.[1]).toEqual(retriedB?.[1]);
  expect(retriedA?.[2]).toEqual(retriedB?.[2]);
  expect(retriedA?.[2]).toEqual(
   expect.objectContaining({
    progress: expect.objectContaining({
     vocab: expect.objectContaining({
      "retry-a": expect.any(Object),
      "retry-b": expect.any(Object),
     }),
    }),
   }),
  );
  expect(retriedA?.[3]).toEqual(localFirst.save.mock.calls[0]?.[3]);
  expect(retriedB?.[3]).toEqual(localFirst.save.mock.calls[1]?.[3]);
 });

 it("retains all review intents and their identities across repeated local failures", async () => {
  outbox.enqueue.mockRejectedValue(new Error("Storage unavailable"));
  let retry = () => Promise.resolve();
  function Actions() {
   const learning = useLearningState();
   retry = async () => {
    await learning.retrySync();
   };
   learning.recordReview({ type: "radical", id: "review-a", label: "水" }, "known");
   learning.recordReview({ type: "radical", id: "review-b", label: "火" }, "hard");
   return null;
  }
  renderToStaticMarkup(
   createElement(QueryClientProvider, { client: queryClient }, createElement(Actions)),
  );
  await vi.waitFor(() => expect(outbox.enqueue).toHaveBeenCalledTimes(2));
  await vi.waitFor(() =>
   expect(getLearningStateSyncState("test-user-123").durability).toBe("failed"),
  );
  await retry();
  expect(outbox.enqueue).toHaveBeenCalledTimes(3);
  outbox.enqueue.mockResolvedValue(undefined);
  await retry();
  expect(outbox.enqueue).toHaveBeenCalledTimes(5);
  expect(outbox.enqueue.mock.calls[3]).toEqual(outbox.enqueue.mock.calls[0]);
  expect(outbox.enqueue.mock.calls[4]).toEqual(outbox.enqueue.mock.calls[1]);
 });
});
