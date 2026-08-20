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
 putInStore,
 readFromStore,
 replaceInStoreIf,
} from "./hanzihome-local-db";

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
