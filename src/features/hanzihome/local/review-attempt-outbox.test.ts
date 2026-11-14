import { beforeEach, describe, expect, it, vi } from "vitest";

const localDb = vi.hoisted(() => ({
 deleteIf: vi.fn(),
 listMatching: vi.fn(),
 put: vi.fn(),
 replaceIf: vi.fn(),
}));
const practice = vi.hoisted(() => ({
 save: vi.fn(),
 ApiError: class extends Error {
  constructor(
   message: string,
   readonly status: number,
  ) {
   super(message);
   this.name = "PracticeAttemptApiError";
  }
 },
}));

vi.mock("./hanzihome-local-db", () => ({
 HANZIHOME_LOCAL_STORES: { pendingMutations: "pending_mutations" },
 deleteFromStoreIf: localDb.deleteIf,
 getAllFromStoreMatching: localDb.listMatching,
 putInStore: localDb.put,
 replaceInStoreIf: localDb.replaceIf,
}));
vi.mock("@/features/hanzihome/practice/practice-attempt-api", () => ({
 savePracticeAttempt: practice.save,
 PracticeAttemptApiError: practice.ApiError,
}));

import {
 enqueueReviewAttempt,
 syncPendingReviewAttempts,
 type PendingReviewAttemptMutation,
} from "./review-attempt-outbox";

const ownerUserId = "user-a";
const attemptId = "af84c8d0-aa7f-4af7-a4b7-71ff6e887a35";

describe("review attempt outbox", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("crypto", { randomUUID: () => attemptId });
  localDb.put.mockResolvedValue(undefined);
  localDb.deleteIf.mockResolvedValue(true);
  practice.save.mockResolvedValue({ id: attemptId });
 });

 it("creates an owner-scoped durable mutation with a stable attempt id", async () => {
  const mutation = await enqueueReviewAttempt(ownerUserId, {
   itemType: "vocab",
   itemId: "word-1",
   label: "坚持",
   result: "hard",
  });

  expect(mutation).toMatchObject({
   id: `review_attempt:${ownerUserId}:${attemptId}`,
   ownerUserId,
   type: "review_attempt.append",
   status: "pending",
   attemptId,
   payload: {
    itemType: "vocab",
    itemId: "word-1",
    label: "坚持",
    result: "hard",
   },
  });
  expect(localDb.put).toHaveBeenCalledWith("pending_mutations", mutation);
 });

 it("reuses the same attempt id while draining and removes only the matching generation", async () => {
  const pending = await enqueueReviewAttempt(ownerUserId, {
   itemType: "grammar",
   itemId: "grammar-1",
   result: "known",
  });
  const syncing: PendingReviewAttemptMutation = {
   ...pending,
   status: "syncing",
   attemptCount: 1,
   updatedAt: "2026-08-20T05:00:01.000Z",
  };

  localDb.listMatching.mockResolvedValueOnce([pending]).mockResolvedValueOnce([]);
  localDb.replaceIf.mockResolvedValueOnce(syncing);

  const result = await syncPendingReviewAttempts(ownerUserId);

  expect(practice.save).toHaveBeenCalledWith(
   {
    attemptId,
    surface: "review",
    contentId: "grammar:grammar-1",
    direction: null,
    answer: expect.objectContaining({
     kind: "review",
     itemType: "grammar",
     result: "known",
     answeredAt: pending.payload.answeredAt,
    }),
    scorePercent: null,
    responseMs: null,
   },
   { expectedOwnerId: ownerUserId },
  );
  expect(localDb.deleteIf).toHaveBeenCalledOnce();
  expect(result).toEqual({ status: "synced", syncedCount: 1, pendingCount: 0 });
 });

 it("keeps owner-specific evidence pending while offline", async () => {
  const pending = await enqueueReviewAttempt(ownerUserId, {
   itemType: "radical",
   itemId: "radical-1",
   result: "again",
  });
  localDb.listMatching.mockResolvedValue([pending]);
  vi.stubGlobal("navigator", { onLine: false });

  const result = await syncPendingReviewAttempts(ownerUserId);

  expect(practice.save).not.toHaveBeenCalled();
  expect(result).toEqual({ status: "pending", syncedCount: 0, pendingCount: 1 });
 });

 it("stops drain and preserves pending queue without failure marking on 412 owner mismatch", async () => {
  const pending = await enqueueReviewAttempt(ownerUserId, {
   itemType: "vocab",
   itemId: "word-1",
   result: "known",
  });
  const syncing: PendingReviewAttemptMutation = {
   ...pending,
   status: "syncing",
   attemptCount: 1,
   updatedAt: "2026-08-20T05:00:01.000Z",
  };

  localDb.listMatching.mockResolvedValueOnce([pending]).mockResolvedValueOnce([pending]);
  localDb.replaceIf.mockResolvedValueOnce(syncing);
  practice.save.mockRejectedValueOnce(
   new practice.ApiError("Request owner no longer matches the authenticated session", 412),
  );

  const result = await syncPendingReviewAttempts(ownerUserId);

  expect(practice.save).toHaveBeenCalledWith(expect.any(Object), { expectedOwnerId: ownerUserId });
  // Should NOT mark failed or delete the mutation
  expect(localDb.deleteIf).not.toHaveBeenCalled();
  expect(result).toEqual({
   status: "error",
   syncedCount: 0,
   pendingCount: 1,
   error: "Request owner no longer matches the authenticated session",
   isOwnerMismatch: true,
  });
 });
});
