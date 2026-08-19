"use client";

import type { JsonFieldValue } from "@/types/json";
import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import type { UserLearningState } from "@/features/hanzihome/types";
import { normalizeLearningState } from "@/features/hanzihome/utils/learning-state";
import { z } from "zod";

import {
 deleteFromStore,
 getAllFromStore,
 HANZIHOME_LOCAL_STORES,
 putInStore,
 readFromStore,
} from "./hanzihome-local-db";

const LEARNING_STATE_RECORD_ID = "current";
const LEARNING_STATE_PENDING_MUTATION_ID = "learning_state:current";

const LearningStateLocalRecordSchema = z.object({
 id: z.literal(LEARNING_STATE_RECORD_ID),
 state: userLearningStateSchema,
 updatedAt: z.string(),
 lastSyncedAt: z.string().optional(),
 lastSyncError: z.string().optional(),
});
export type LearningStateLocalRecord = z.infer<typeof LearningStateLocalRecordSchema>;

const PendingMutationStatusSchema = z.enum(["pending", "syncing", "failed"]);
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

const PendingLearningStateMutationSchema = z.object({
 id: z.literal(LEARNING_STATE_PENDING_MUTATION_ID),
 type: z.literal("learning_state.replace"),
 status: PendingMutationStatusSchema,
 payload: userLearningStateSchema,
 createdAt: z.string(),
 updatedAt: z.string(),
 attemptCount: z.number(),
 lastError: z.string().optional(),
});
export type PendingLearningStateMutation = z.infer<typeof PendingLearningStateMutationSchema>;

function parseLearningState(value: JsonFieldValue): Nullable<UserLearningState> {
 const parsed = userLearningStateSchema.safeParse(value);
 return parsed.success ? normalizeLearningState(parsed.data) : null;
}

export async function readLocalLearningState(): Promise<Nullable<LearningStateLocalRecord>> {
 const record = await readFromStore(
  HANZIHOME_LOCAL_STORES.learningState,
  LEARNING_STATE_RECORD_ID,
  LearningStateLocalRecordSchema,
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

export async function readPendingLearningStateMutation(): Promise<
 Nullable<PendingLearningStateMutation>
> {
 return readFromStore(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  LEARNING_STATE_PENDING_MUTATION_ID,
  PendingLearningStateMutationSchema,
 );
}

export async function listPendingLearningStateMutations(): Promise<PendingLearningStateMutation[]> {
 const mutations = await getAllFromStore(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  PendingLearningStateMutationSchema,
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
