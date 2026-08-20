"use client";

import { z } from "zod";

import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import { reviewResultSchema } from "@/features/hanzihome/schemas/learning-state.schema";

import {
 deleteFromStoreIf,
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 putInStore,
 replaceInStoreIf,
} from "./hanzihome-local-db";

const reviewItemTypeSchema = z.enum(["vocab", "grammar", "radical"]);
const pendingReviewAttemptStatusSchema = z.enum(["pending", "syncing", "failed"]);

const pendingReviewAttemptMutationSchema = z.object({
 id: z.string().min(1),
 ownerUserId: z.string().min(1),
 type: z.literal("review_attempt.append"),
 status: pendingReviewAttemptStatusSchema,
 attemptId: z.uuid(),
 payload: z.strictObject({
  itemType: reviewItemTypeSchema,
  itemId: z.string().min(1),
  label: z.string().optional(),
  result: reviewResultSchema,
  answeredAt: z.iso.datetime({ offset: true }),
 }),
 createdAt: z.iso.datetime({ offset: true }),
 updatedAt: z.iso.datetime({ offset: true }),
 attemptCount: z.number().int().nonnegative(),
 lastError: z.string().optional(),
});

export type PendingReviewAttemptMutation = z.output<typeof pendingReviewAttemptMutationSchema>;
export type ReviewAttemptInput = Pick<
 PendingReviewAttemptMutation["payload"],
 "itemType" | "itemId" | "label" | "result"
>;

export type ReviewAttemptSyncResult = {
 status: "synced" | "pending" | "error";
 syncedCount: number;
 pendingCount: number;
 error?: string;
};

const inFlightByOwner = new Map<string, Promise<ReviewAttemptSyncResult>>();

function mutationId(ownerUserId: string, attemptId: string) {
 return `review_attempt:${ownerUserId}:${attemptId}`;
}

function isSameGeneration(
 current: PendingReviewAttemptMutation,
 expected: PendingReviewAttemptMutation,
) {
 return (
  current.id === expected.id &&
  current.ownerUserId === expected.ownerUserId &&
  current.updatedAt === expected.updatedAt
 );
}

function isBrowserOnline() {
 return typeof navigator === "undefined" || navigator.onLine;
}

export async function enqueueReviewAttempt(
 ownerUserId: string,
 input: ReviewAttemptInput,
): Promise<PendingReviewAttemptMutation> {
 const attemptId = crypto.randomUUID();
 const now = new Date().toISOString();
 const mutation = pendingReviewAttemptMutationSchema.parse({
  id: mutationId(ownerUserId, attemptId),
  ownerUserId,
  type: "review_attempt.append",
  status: "pending",
  attemptId,
  payload: {
   ...input,
   answeredAt: now,
  },
  createdAt: now,
  updatedAt: now,
  attemptCount: 0,
 });
 await putInStore(HANZIHOME_LOCAL_STORES.pendingMutations, mutation);
 return mutation;
}

export async function listPendingReviewAttemptMutations(
 ownerUserId: string,
): Promise<PendingReviewAttemptMutation[]> {
 const mutations = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  pendingReviewAttemptMutationSchema,
 );
 return mutations
  .filter(
   (mutation) => mutation.type === "review_attempt.append" && mutation.ownerUserId === ownerUserId,
  )
  .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

async function markSyncing(
 mutation: PendingReviewAttemptMutation,
): Promise<PendingReviewAttemptMutation | null> {
 return replaceInStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  mutation.id,
  pendingReviewAttemptMutationSchema,
  (current) => isSameGeneration(current, mutation),
  (current) => ({
   ...current,
   status: "syncing",
   attemptCount: current.attemptCount + 1,
   updatedAt: new Date().toISOString(),
   lastError: undefined,
  }),
 );
}

async function markFailed(
 mutation: PendingReviewAttemptMutation,
 error: string,
): Promise<PendingReviewAttemptMutation | null> {
 return replaceInStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  mutation.id,
  pendingReviewAttemptMutationSchema,
  (current) => isSameGeneration(current, mutation),
  (current): PendingReviewAttemptMutation => ({
   ...current,
   status: "failed",
   updatedAt: new Date().toISOString(),
   lastError: error,
  }),
 );
}

async function clearMutation(mutation: PendingReviewAttemptMutation) {
 return deleteFromStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  mutation.id,
  pendingReviewAttemptMutationSchema,
  (current) => isSameGeneration(current, mutation),
 );
}

async function drainReviewAttempts(ownerUserId: string): Promise<ReviewAttemptSyncResult> {
 const initial = await listPendingReviewAttemptMutations(ownerUserId);
 if (initial.length === 0) return { status: "synced", syncedCount: 0, pendingCount: 0 };
 if (!isBrowserOnline()) {
  return { status: "pending", syncedCount: 0, pendingCount: initial.length };
 }

 let syncedCount = 0;
 for (const pending of initial) {
  const active = await markSyncing(pending);
  if (!active) continue;
  try {
   await savePracticeAttempt({
    attemptId: active.attemptId,
    surface: "review",
    contentId: `${active.payload.itemType}:${active.payload.itemId}`,
    direction: null,
    answer: {
     kind: "review",
     itemType: active.payload.itemType,
     result: active.payload.result,
     ...(active.payload.label ? { label: active.payload.label } : {}),
     answeredAt: active.payload.answeredAt,
    },
    scorePercent: null,
    responseMs: null,
   });
   if (await clearMutation(active)) syncedCount += 1;
  } catch (error) {
   const message = error instanceof Error ? error.message : "Không lưu được lịch sử ôn tập.";
   await markFailed(active, message);
   const remaining = await listPendingReviewAttemptMutations(ownerUserId);
   return {
    status: "error",
    syncedCount,
    pendingCount: remaining.length,
    error: message,
   };
  }
 }

 const remaining = await listPendingReviewAttemptMutations(ownerUserId);
 return {
  status: remaining.length > 0 ? "pending" : "synced",
  syncedCount,
  pendingCount: remaining.length,
 };
}

export function syncPendingReviewAttempts(ownerUserId: string): Promise<ReviewAttemptSyncResult> {
 const current = inFlightByOwner.get(ownerUserId);
 if (current) return current;
 const next = drainReviewAttempts(ownerUserId).finally(() => {
  if (inFlightByOwner.get(ownerUserId) === next) inFlightByOwner.delete(ownerUserId);
 });
 inFlightByOwner.set(ownerUserId, next);
 return next;
}
