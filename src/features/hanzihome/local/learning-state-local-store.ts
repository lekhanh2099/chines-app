"use client";

import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import type { UserLearningState } from "@/features/hanzihome/types";
import { normalizeLearningState } from "@/features/hanzihome/utils/learning-state";

import {
 deleteFromStore,
 getAllFromStore,
 HANZIHOME_LOCAL_STORES,
 putInStore,
 readFromStore,
} from "./hanzihome-local-db";

const LEARNING_STATE_RECORD_ID = "current";
const LEARNING_STATE_PENDING_MUTATION_ID = "learning_state:current";

export type LearningStateLocalRecord = {
 id: typeof LEARNING_STATE_RECORD_ID;
 state: UserLearningState;
 updatedAt: string;
 lastSyncedAt?: string;
 lastSyncError?: string;
};

export type PendingMutationStatus = "pending" | "syncing" | "failed";

export type PendingLearningStateMutation = {
 id: typeof LEARNING_STATE_PENDING_MUTATION_ID;
 type: "learning_state.replace";
 status: PendingMutationStatus;
 payload: UserLearningState;
 createdAt: string;
 updatedAt: string;
 attemptCount: number;
 lastError?: string;
};

function parseLearningState(value: unknown): UserLearningState | null {
 const parsed = userLearningStateSchema.safeParse(value);
 return parsed.success ? normalizeLearningState(parsed.data) : null;
}

export async function readLocalLearningState(): Promise<LearningStateLocalRecord | null> {
 const record = await readFromStore<LearningStateLocalRecord>(
  HANZIHOME_LOCAL_STORES.learningState,
  LEARNING_STATE_RECORD_ID,
 );
 const state = parseLearningState(record?.state);

 return state && record
  ? {
     ...record,
     state,
    }
  : null;
}

export async function writeLocalLearningState({
 state,
 lastSyncedAt,
 lastSyncError,
}: {
 state: UserLearningState;
 lastSyncedAt?: string;
 lastSyncError?: string;
}): Promise<LearningStateLocalRecord> {
 const record: LearningStateLocalRecord = {
  id: LEARNING_STATE_RECORD_ID,
  state: normalizeLearningState(state),
  updatedAt: new Date().toISOString(),
  lastSyncedAt,
  lastSyncError,
 };

 await putInStore(HANZIHOME_LOCAL_STORES.learningState, record);
 return record;
}

export async function enqueueLearningStateSync(
 state: UserLearningState,
): Promise<PendingLearningStateMutation> {
 const now = new Date().toISOString();
 const existing = await readPendingLearningStateMutation();
 const mutation: PendingLearningStateMutation = {
  id: LEARNING_STATE_PENDING_MUTATION_ID,
  type: "learning_state.replace",
  status: "pending",
  payload: normalizeLearningState(state),
  createdAt: existing?.createdAt ?? now,
  updatedAt: now,
  attemptCount: existing?.attemptCount ?? 0,
  lastError: existing?.lastError,
 };

 await putInStore(HANZIHOME_LOCAL_STORES.pendingMutations, mutation);
 return mutation;
}

export async function readPendingLearningStateMutation(): Promise<PendingLearningStateMutation | null> {
 return readFromStore<PendingLearningStateMutation>(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  LEARNING_STATE_PENDING_MUTATION_ID,
 );
}

export async function listPendingLearningStateMutations(): Promise<PendingLearningStateMutation[]> {
 const mutations = await getAllFromStore<PendingLearningStateMutation>(
  HANZIHOME_LOCAL_STORES.pendingMutations,
 );

 return mutations
  .filter((mutation) => mutation.type === "learning_state.replace")
  .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function markLearningStateMutationSyncing(
 mutation: PendingLearningStateMutation,
): Promise<PendingLearningStateMutation> {
 const next: PendingLearningStateMutation = {
  ...mutation,
  status: "syncing",
  attemptCount: mutation.attemptCount + 1,
  updatedAt: new Date().toISOString(),
 };

 await putInStore(HANZIHOME_LOCAL_STORES.pendingMutations, next);
 return next;
}

export async function markLearningStateMutationFailed({
 mutation,
 error,
}: {
 mutation: PendingLearningStateMutation;
 error: string;
}): Promise<PendingLearningStateMutation> {
 const next: PendingLearningStateMutation = {
  ...mutation,
  status: "failed",
  lastError: error,
  updatedAt: new Date().toISOString(),
 };

 await putInStore(HANZIHOME_LOCAL_STORES.pendingMutations, next);
 await writeLocalLearningState({
  state: mutation.payload,
  lastSyncError: error,
 });
 return next;
}

export async function clearPendingLearningStateMutation(): Promise<void> {
 await deleteFromStore(HANZIHOME_LOCAL_STORES.pendingMutations, LEARNING_STATE_PENDING_MUTATION_ID);
}
