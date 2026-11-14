"use client";

import type { JsonFieldValue } from "@/types/json";
import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import type { UserLearningState } from "@/features/hanzihome/types";
import { normalizeLearningState } from "@/features/hanzihome/utils/learning-state";
import { z } from "zod";

import {
 deleteFromStore,
 deleteFromStoreIf,
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 promisifyRequest,
 putInStore,
 readFromStore,
 replaceInStoreIf,
 runInLocalTransaction,
} from "./hanzihome-local-db";
import {
 buildPendingReviewAttemptMutation,
 type PendingReviewAttemptMutation,
 type ReviewAttemptInput,
} from "./review-attempt-outbox";

const LEGACY_LEARNING_STATE_RECORD_ID = "current";
const LEGACY_LEARNING_STATE_PENDING_MUTATION_ID = "learning_state:current";

const LearningStateLocalRecordSchema = z.object({
 id: z.string().min(1),
 ownerUserId: z.string().min(1),
 state: userLearningStateSchema,
 lastSyncedState: userLearningStateSchema.optional(),
 remoteUpdatedAt: z.string().nullable().optional(),
 updatedAt: z.string(),
 lastSyncedAt: z.string().optional(),
 lastSyncError: z.string().optional(),
});
export type LearningStateLocalRecord = z.infer<typeof LearningStateLocalRecordSchema>;

const PendingMutationStatusSchema = z.enum(["pending", "syncing", "failed"]);
type Nullable<T> = T | null;

const PendingLearningStateMutationSchema = z.object({
 id: z.string().min(1),
 ownerUserId: z.string().min(1),
 type: z.literal("learning_state.replace"),
 status: PendingMutationStatusSchema,
 payload: userLearningStateSchema,
 baseState: userLearningStateSchema.optional(),
 expectedUpdatedAt: z.string().nullable().optional(),
 createdAt: z.string(),
 updatedAt: z.string(),
 attemptCount: z.number(),
 lastError: z.string().optional(),
});
export type PendingLearningStateMutation = z.infer<typeof PendingLearningStateMutationSchema>;

let legacyDiscardPromise: Promise<void> | null = null;

function learningStateRecordId(ownerUserId: string) {
 return `learning_state:${ownerUserId}:current`;
}

function pendingLearningStateMutationId(ownerUserId: string) {
 return `learning_state:${ownerUserId}:pending`;
}

async function discardLegacyLearningStateRecords() {
 if (!legacyDiscardPromise) {
  legacyDiscardPromise = Promise.all([
   deleteFromStore(HANZIHOME_LOCAL_STORES.learningState, LEGACY_LEARNING_STATE_RECORD_ID),
   deleteFromStore(
    HANZIHOME_LOCAL_STORES.pendingMutations,
    LEGACY_LEARNING_STATE_PENDING_MUTATION_ID,
   ),
  ])
   .then(() => undefined)
   .catch((error) => {
    legacyDiscardPromise = null;
    throw error;
   });
 }
 return legacyDiscardPromise;
}

function parseLearningState(value: JsonFieldValue): Nullable<UserLearningState> {
 const parsed = userLearningStateSchema.safeParse(value);
 return parsed.success ? normalizeLearningState(parsed.data) : null;
}

function isSameMutationGeneration(
 current: PendingLearningStateMutation,
 expected: PendingLearningStateMutation,
) {
 return (
  current.ownerUserId === expected.ownerUserId &&
  current.id === expected.id &&
  current.updatedAt === expected.updatedAt
 );
}

export async function readLocalLearningState(
 ownerUserId: string,
): Promise<Nullable<LearningStateLocalRecord>> {
 await discardLegacyLearningStateRecords();
 const expectedId = learningStateRecordId(ownerUserId);
 const record = await readFromStore(
  HANZIHOME_LOCAL_STORES.learningState,
  expectedId,
  LearningStateLocalRecordSchema,
 );
 if (!record || record.id !== expectedId || record.ownerUserId !== ownerUserId) return null;

 const state = parseLearningState(record.state);
 return state
  ? {
     ...record,
     state,
    }
  : null;
}

export async function writeLocalLearningState({
 ownerUserId,
 state,
 lastSyncedAt,
 lastSyncError,
 lastSyncedState,
 remoteUpdatedAt,
}: {
 ownerUserId: string;
 state: UserLearningState;
 lastSyncedAt?: string;
 lastSyncError?: string;
 lastSyncedState?: UserLearningState;
 remoteUpdatedAt?: string | null;
}): Promise<LearningStateLocalRecord> {
 await discardLegacyLearningStateRecords();
 const record: LearningStateLocalRecord = {
  id: learningStateRecordId(ownerUserId),
  ownerUserId,
  state: normalizeLearningState(state),
  lastSyncedState:
   lastSyncedState === undefined ? undefined : normalizeLearningState(lastSyncedState),
  remoteUpdatedAt,
  updatedAt: new Date().toISOString(),
  lastSyncedAt,
  lastSyncError,
 };

 await putInStore(HANZIHOME_LOCAL_STORES.learningState, record);
 return record;
}

export async function enqueueLearningStateSync(
 ownerUserId: string,
 baseState: UserLearningState,
 state: UserLearningState,
 expectedUpdatedAt: string | null,
): Promise<PendingLearningStateMutation> {
 const now = new Date().toISOString();
 const existing = await readPendingLearningStateMutation(ownerUserId);
 const mutation: PendingLearningStateMutation = {
  id: pendingLearningStateMutationId(ownerUserId),
  ownerUserId,
  type: "learning_state.replace",
  status: "pending",
  payload: normalizeLearningState(state),
  baseState: existing?.baseState ?? normalizeLearningState(baseState),
  expectedUpdatedAt: existing?.expectedUpdatedAt ?? expectedUpdatedAt,
  createdAt: existing?.createdAt ?? now,
  updatedAt: now,
  attemptCount: existing?.attemptCount ?? 0,
  lastError: existing?.lastError,
 };

 await putInStore(HANZIHOME_LOCAL_STORES.pendingMutations, mutation);
 return mutation;
}

export async function replacePendingLearningStateMutation({
 mutation,
 baseState,
 state,
 expectedUpdatedAt,
}: {
 mutation: PendingLearningStateMutation;
 baseState: UserLearningState;
 state: UserLearningState;
 expectedUpdatedAt: string | null;
}): Promise<Nullable<PendingLearningStateMutation>> {
 return replaceInStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  mutation.id,
  PendingLearningStateMutationSchema,
  (current) => isSameMutationGeneration(current, mutation),
  (current) => ({
   ...current,
   status: "pending",
   payload: normalizeLearningState(state),
   baseState: normalizeLearningState(baseState),
   expectedUpdatedAt,
   updatedAt: new Date().toISOString(),
   lastError: undefined,
  }),
 );
}

export async function readPendingLearningStateMutation(
 ownerUserId: string,
): Promise<Nullable<PendingLearningStateMutation>> {
 await discardLegacyLearningStateRecords();
 const expectedId = pendingLearningStateMutationId(ownerUserId);
 const mutation = await readFromStore(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  expectedId,
  PendingLearningStateMutationSchema,
 );

 return mutation && mutation.id === expectedId && mutation.ownerUserId === ownerUserId
  ? mutation
  : null;
}

export async function listPendingLearningStateMutations(
 ownerUserId: string,
): Promise<PendingLearningStateMutation[]> {
 await discardLegacyLearningStateRecords();
 const expectedId = pendingLearningStateMutationId(ownerUserId);
 const mutations = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  PendingLearningStateMutationSchema,
 );

 return mutations
  .filter(
   (mutation) =>
    mutation.type === "learning_state.replace" &&
    mutation.ownerUserId === ownerUserId &&
    mutation.id === expectedId,
  )
  .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function markLearningStateMutationSyncing(
 mutation: PendingLearningStateMutation,
): Promise<Nullable<PendingLearningStateMutation>> {
 return replaceInStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  mutation.id,
  PendingLearningStateMutationSchema,
  (current) => isSameMutationGeneration(current, mutation),
  (current) => ({
   ...current,
   status: "syncing",
   attemptCount: current.attemptCount + 1,
   updatedAt: new Date().toISOString(),
  }),
 );
}

export async function markLearningStateMutationFailed({
 mutation,
 error,
}: {
 mutation: PendingLearningStateMutation;
 error: string;
}): Promise<Nullable<PendingLearningStateMutation>> {
 const failed = await replaceInStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  mutation.id,
  PendingLearningStateMutationSchema,
  (current) => isSameMutationGeneration(current, mutation),
  (current): PendingLearningStateMutation => ({
   ...current,
   status: "failed",
   lastError: error,
   updatedAt: new Date().toISOString(),
  }),
 );

 if (!failed) return null;

 await writeLocalLearningState({
  ownerUserId: failed.ownerUserId,
  state: failed.payload,
  lastSyncedState: failed.baseState,
  remoteUpdatedAt: failed.expectedUpdatedAt,
  lastSyncError: error,
 });
 return failed;
}

export async function clearPendingLearningStateMutation(
 ownerUserId: string,
 expectedUpdatedAt: string,
): Promise<boolean> {
 const expectedId = pendingLearningStateMutationId(ownerUserId);
 return deleteFromStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  expectedId,
  PendingLearningStateMutationSchema,
  (mutation) =>
   mutation.ownerUserId === ownerUserId &&
   mutation.id === expectedId &&
   mutation.updatedAt === expectedUpdatedAt,
 );
}

export async function saveLearningStateAtomic({
 ownerUserId,
 baseState,
 nextState,
 expectedUpdatedAt,
 reviewAttempt,
}: {
 ownerUserId: string;
 baseState: UserLearningState;
 nextState: UserLearningState;
 expectedUpdatedAt?: string | null;
 reviewAttempt?: {
  attemptId: string;
  input: ReviewAttemptInput;
 };
}): Promise<{
 localRecord: LearningStateLocalRecord;
 pendingMutation: PendingLearningStateMutation;
 reviewMutation?: PendingReviewAttemptMutation;
}> {
 await discardLegacyLearningStateRecords();
 const stateRecordId = learningStateRecordId(ownerUserId);
 const mutationRecordId = pendingLearningStateMutationId(ownerUserId);

 return runInLocalTransaction(
  [HANZIHOME_LOCAL_STORES.learningState, HANZIHOME_LOCAL_STORES.pendingMutations],
  "readwrite",
  async (stores) => {
   const stateStore = stores[HANZIHOME_LOCAL_STORES.learningState];
   const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];

   const existingStateRaw = await promisifyRequest(stateStore.get(stateRecordId));
   const existingMutationRaw = await promisifyRequest(mutationStore.get(mutationRecordId));

   const parsedState = LearningStateLocalRecordSchema.safeParse(existingStateRaw);
   const existingState = parsedState.success ? parsedState.data : null;

   const parsedMutation = PendingLearningStateMutationSchema.safeParse(existingMutationRaw);
   const existingMutation = parsedMutation.success ? parsedMutation.data : null;

   let now = new Date().toISOString();
   const maxPrevUpdatedAt = Math.max(
    existingMutation ? new Date(existingMutation.updatedAt).getTime() : 0,
    existingState ? new Date(existingState.updatedAt).getTime() : 0,
   );
   if (maxPrevUpdatedAt >= new Date(now).getTime()) {
    now = new Date(maxPrevUpdatedAt + 1).toISOString();
   }

   const normalizedNext = normalizeLearningState(nextState);
   const resolvedBaseState =
    existingMutation?.baseState ??
    (existingState?.lastSyncedState
     ? normalizeLearningState(existingState.lastSyncedState)
     : normalizeLearningState(baseState));
   const resolvedExpectedUpdatedAt =
    existingMutation?.expectedUpdatedAt ??
    existingState?.remoteUpdatedAt ??
    expectedUpdatedAt ??
    null;

   const localRecord: LearningStateLocalRecord = {
    id: stateRecordId,
    ownerUserId,
    state: normalizedNext,
    lastSyncedState: existingState?.lastSyncedState,
    remoteUpdatedAt: resolvedExpectedUpdatedAt,
    updatedAt: now,
    lastSyncedAt: existingState?.lastSyncedAt,
    lastSyncError: undefined,
   };

   const pendingMutation: PendingLearningStateMutation = {
    id: mutationRecordId,
    ownerUserId,
    type: "learning_state.replace",
    status: "pending",
    payload: normalizedNext,
    baseState: resolvedBaseState,
    expectedUpdatedAt: resolvedExpectedUpdatedAt,
    createdAt: existingMutation?.createdAt ?? now,
    updatedAt: now,
    attemptCount: existingMutation?.attemptCount ?? 0,
    lastError: undefined,
   };

   let reviewMutation: PendingReviewAttemptMutation | undefined;
   if (reviewAttempt) {
    reviewMutation = buildPendingReviewAttemptMutation({
     ownerUserId,
     attemptId: reviewAttempt.attemptId,
     input: reviewAttempt.input,
     now,
    });
    mutationStore.put(reviewMutation);
   }

   stateStore.put(localRecord);
   mutationStore.put(pendingMutation);

   return {
    localRecord,
    pendingMutation,
    reviewMutation,
   };
  },
 );
}

export async function acknowledgeLearningStateSyncAtomic({
 ownerUserId,
 expectedMutationUpdatedAt,
 savedState,
 remoteUpdatedAt,
}: {
 ownerUserId: string;
 expectedMutationUpdatedAt: string;
 savedState: UserLearningState;
 remoteUpdatedAt: string | null;
}): Promise<boolean> {
 await discardLegacyLearningStateRecords();
 const stateRecordId = learningStateRecordId(ownerUserId);
 const mutationRecordId = pendingLearningStateMutationId(ownerUserId);

 return runInLocalTransaction(
  [HANZIHOME_LOCAL_STORES.learningState, HANZIHOME_LOCAL_STORES.pendingMutations],
  "readwrite",
  async (stores) => {
   const stateStore = stores[HANZIHOME_LOCAL_STORES.learningState];
   const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];

   const currentMutationRaw = await promisifyRequest(mutationStore.get(mutationRecordId));
   const parsedMutation = PendingLearningStateMutationSchema.safeParse(currentMutationRaw);

   if (
    !parsedMutation.success ||
    parsedMutation.data.ownerUserId !== ownerUserId ||
    parsedMutation.data.updatedAt !== expectedMutationUpdatedAt
   ) {
    return false;
   }

   mutationStore.delete(mutationRecordId);

   const currentStateRaw = await promisifyRequest(stateStore.get(stateRecordId));
   const parsedState = LearningStateLocalRecordSchema.safeParse(currentStateRaw);
   const normalizedSaved = normalizeLearningState(savedState);
   const now = new Date().toISOString();

   if (parsedState.success) {
    const updatedRecord: LearningStateLocalRecord = {
     ...parsedState.data,
     lastSyncedState: normalizedSaved,
     remoteUpdatedAt,
     lastSyncedAt: now,
     lastSyncError: undefined,
    };
    stateStore.put(updatedRecord);
   } else {
    const newRecord: LearningStateLocalRecord = {
     id: stateRecordId,
     ownerUserId,
     state: normalizedSaved,
     lastSyncedState: normalizedSaved,
     remoteUpdatedAt,
     updatedAt: now,
     lastSyncedAt: now,
     lastSyncError: undefined,
    };
    stateStore.put(newRecord);
   }

   return true;
  },
 );
}

export async function markLearningStateMutationFailedAtomic({
 ownerUserId,
 expectedMutationUpdatedAt,
 error,
}: {
 ownerUserId: string;
 expectedMutationUpdatedAt: string;
 error: string;
}): Promise<boolean> {
 await discardLegacyLearningStateRecords();
 const stateRecordId = learningStateRecordId(ownerUserId);
 const mutationRecordId = pendingLearningStateMutationId(ownerUserId);

 return runInLocalTransaction(
  [HANZIHOME_LOCAL_STORES.learningState, HANZIHOME_LOCAL_STORES.pendingMutations],
  "readwrite",
  async (stores) => {
   const stateStore = stores[HANZIHOME_LOCAL_STORES.learningState];
   const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];

   const currentMutationRaw = await promisifyRequest(mutationStore.get(mutationRecordId));
   const parsedMutation = PendingLearningStateMutationSchema.safeParse(currentMutationRaw);

   if (
    !parsedMutation.success ||
    parsedMutation.data.ownerUserId !== ownerUserId ||
    parsedMutation.data.updatedAt !== expectedMutationUpdatedAt
   ) {
    return false;
   }

   const now = new Date().toISOString();
   const failedMutation: PendingLearningStateMutation = {
    ...parsedMutation.data,
    status: "failed",
    lastError: error,
    updatedAt: now,
   };
   mutationStore.put(failedMutation);

   const currentStateRaw = await promisifyRequest(stateStore.get(stateRecordId));
   const parsedState = LearningStateLocalRecordSchema.safeParse(currentStateRaw);
   if (parsedState.success) {
    stateStore.put({
     ...parsedState.data,
     lastSyncError: error,
    });
   }

   return true;
  },
 );
}

export async function rebaseLearningStateMutationAtomic({
 ownerUserId,
 expectedMutationUpdatedAt,
 baseState,
 mergedState,
 remoteUpdatedAt,
}: {
 ownerUserId: string;
 expectedMutationUpdatedAt: string;
 baseState: UserLearningState;
 mergedState: UserLearningState;
 remoteUpdatedAt: string | null;
}): Promise<PendingLearningStateMutation | null> {
 await discardLegacyLearningStateRecords();
 const stateRecordId = learningStateRecordId(ownerUserId);
 const mutationRecordId = pendingLearningStateMutationId(ownerUserId);

 return runInLocalTransaction(
  [HANZIHOME_LOCAL_STORES.learningState, HANZIHOME_LOCAL_STORES.pendingMutations],
  "readwrite",
  async (stores) => {
   const stateStore = stores[HANZIHOME_LOCAL_STORES.learningState];
   const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];

   const currentMutationRaw = await promisifyRequest(mutationStore.get(mutationRecordId));
   const parsedMutation = PendingLearningStateMutationSchema.safeParse(currentMutationRaw);

   if (
    !parsedMutation.success ||
    parsedMutation.data.ownerUserId !== ownerUserId ||
    parsedMutation.data.updatedAt !== expectedMutationUpdatedAt
   ) {
    return null;
   }

   const now = new Date().toISOString();
   const normalizedMerged = normalizeLearningState(mergedState);
   const normalizedBase = normalizeLearningState(baseState);

   const rebasedMutation: PendingLearningStateMutation = {
    ...parsedMutation.data,
    status: "pending",
    payload: normalizedMerged,
    baseState: normalizedBase,
    expectedUpdatedAt: remoteUpdatedAt,
    updatedAt: now,
    lastError: undefined,
   };
   mutationStore.put(rebasedMutation);

   const currentStateRaw = await promisifyRequest(stateStore.get(stateRecordId));
   const parsedState = LearningStateLocalRecordSchema.safeParse(currentStateRaw);
   if (parsedState.success) {
    stateStore.put({
     ...parsedState.data,
     state: normalizedMerged,
     lastSyncedState: normalizedBase,
     remoteUpdatedAt,
     updatedAt: now,
    });
   }

   return rebasedMutation;
  },
 );
}

export async function captureLearningStateGeneration(
 ownerUserId: string,
): Promise<{ localUpdatedAt: string | null; hasPending: boolean }> {
 await discardLegacyLearningStateRecords();
 const local = await readLocalLearningState(ownerUserId);
 const pending = await readPendingLearningStateMutation(ownerUserId);
 return {
  localUpdatedAt: local?.updatedAt ?? null,
  hasPending: pending !== null,
 };
}

export async function commitCleanRemoteRefreshAtomic({
 ownerUserId,
 capturedLocalUpdatedAt,
 remoteState,
 remoteUpdatedAt,
}: {
 ownerUserId: string;
 capturedLocalUpdatedAt: string | null;
 remoteState: UserLearningState;
 remoteUpdatedAt: string | null;
}): Promise<boolean> {
 await discardLegacyLearningStateRecords();
 const stateRecordId = learningStateRecordId(ownerUserId);
 const mutationRecordId = pendingLearningStateMutationId(ownerUserId);

 return runInLocalTransaction(
  [HANZIHOME_LOCAL_STORES.learningState, HANZIHOME_LOCAL_STORES.pendingMutations],
  "readwrite",
  async (stores) => {
   const stateStore = stores[HANZIHOME_LOCAL_STORES.learningState];
   const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];

   const currentMutationRaw = await promisifyRequest(mutationStore.get(mutationRecordId));
   if (currentMutationRaw !== undefined) {
    const parsedMutation = PendingLearningStateMutationSchema.safeParse(currentMutationRaw);
    if (parsedMutation.success && parsedMutation.data.ownerUserId === ownerUserId) {
     return false;
    }
   }

   const currentStateRaw = await promisifyRequest(stateStore.get(stateRecordId));
   const parsedState = LearningStateLocalRecordSchema.safeParse(currentStateRaw);
   const currentUpdatedAt = parsedState.success ? parsedState.data.updatedAt : null;
   if (currentUpdatedAt !== capturedLocalUpdatedAt) {
    return false;
   }

   const normalizedRemote = normalizeLearningState(remoteState);
   const now = new Date().toISOString();
   const updatedRecord: LearningStateLocalRecord = {
    id: stateRecordId,
    ownerUserId,
    state: normalizedRemote,
    lastSyncedState: normalizedRemote,
    remoteUpdatedAt,
    updatedAt: now,
    lastSyncedAt: now,
    lastSyncError: undefined,
   };
   stateStore.put(updatedRecord);
   return true;
  },
 );
}
