"use client";

import { parseErrorLike, type ErrorInput } from "@/types/error";
import {
 HanziHomeApiError,
 fetchHanziHomeLearningState,
 saveHanziHomeLearningState,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type { LearningProgressItem, UserLearningState } from "@/features/hanzihome/types";
import { z } from "zod";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

import {
 clearPendingLearningStateMutation,
 enqueueLearningStateSync,
 listPendingLearningStateMutations,
 markLearningStateMutationFailed,
 markLearningStateMutationSyncing,
 readLocalLearningState,
 readPendingLearningStateMutation,
 replacePendingLearningStateMutation,
 writeLocalLearningState,
 type PendingLearningStateMutation,
} from "./learning-state-local-store";

export const LearningStateSyncStatusSchema = z.enum(["synced", "pending", "syncing", "error"]);
export type LearningStateSyncStatus = z.infer<typeof LearningStateSyncStatusSchema>;
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type Optional<T> = z.infer<z.ZodOptional<z.ZodType<T>>>;
type OptionalProgressItem = Optional<LearningProgressItem>;

export type LearningStateSyncResult = {
 status: LearningStateSyncStatus;
 syncedCount: number;
 pendingCount: number;
 state?: UserLearningState;
 error?: string;
};

const remoteRefreshCooldownMs = 15_000;
let remoteRefreshInFlight: Nullable<Promise<Nullable<UserLearningState>>> = null;
let remoteSyncInFlight: Nullable<Promise<LearningStateSyncResult>> = null;
let lastRemoteRefreshAt = 0;

function isBrowserOnline() {
 return typeof navigator === "undefined" || navigator.onLine;
}

function errorMessage(error: ErrorInput) {
 return parseErrorLike(error).message || "Unknown learning-state sync error";
}

export async function loadLearningStateLocalFirst(): Promise<UserLearningState> {
 const local = await readLocalLearningState().catch(() => null);
 if (local) return normalizeLearningState(local.state);

 try {
  const remote = await fetchHanziHomeLearningState();
  const remoteState = normalizeLearningState(remote.state);
  await writeLocalLearningState({
   state: remoteState,
   lastSyncedState: remoteState,
   remoteUpdatedAt: remote.updatedAt,
   lastSyncedAt: new Date().toISOString(),
  });
  return remoteState;
 } catch {
  return normalizeLearningState(emptyLearningState);
 }
}

export async function saveLearningStateLocalFirst(
 baseState: UserLearningState,
 state: UserLearningState,
): Promise<void> {
 const normalized = normalizeLearningState(state);
 const local = await readLocalLearningState().catch(() => null);

 await writeLocalLearningState({
  state: normalized,
  lastSyncedState: local?.lastSyncedState,
  remoteUpdatedAt: local?.remoteUpdatedAt,
 });
 await enqueueLearningStateSync(
  normalizeLearningState(local?.lastSyncedState ?? baseState),
  normalized,
  local?.remoteUpdatedAt ?? null,
 );
}

export async function refreshLearningStateFromRemoteIfClean(): Promise<
 Nullable<UserLearningState>
> {
 if (!isBrowserOnline()) return null;
 if (remoteRefreshInFlight) return remoteRefreshInFlight;
 if (Date.now() - lastRemoteRefreshAt < remoteRefreshCooldownMs) return null;

 remoteRefreshInFlight = (async () => {
  const pending = await readPendingLearningStateMutation();
  if (pending) return null;

  try {
   const remote = await fetchHanziHomeLearningState();
   const remoteState = normalizeLearningState(remote.state);
   await writeLocalLearningState({
    state: remoteState,
    lastSyncedState: remoteState,
    remoteUpdatedAt: remote.updatedAt,
    lastSyncedAt: new Date().toISOString(),
   });
   return remoteState;
  } finally {
   // Failed/unauthenticated attempts must also respect the cooldown. Without
   // this, every focus event retries the same request immediately.
   lastRemoteRefreshAt = Date.now();
  }
 })().finally(() => {
  remoteRefreshInFlight = null;
 });

 return remoteRefreshInFlight;
}

function progressItemsEqual(left: OptionalProgressItem, right: OptionalProgressItem) {
 return (
  left?.level === right?.level &&
  left?.status === right?.status &&
  left?.lastReviewedAt === right?.lastReviewedAt
 );
}

function stringListsEqual(left: string[], right: string[]) {
 return left.length === right.length && left.every((value, index) => value === right[index]);
}

function reviewKey(item: UserLearningState["reviewHistory"][number]) {
 return `${item.type}:${item.id}:${item.result}:${item.answeredAt}`;
}

export function mergeLearningStateAfterConflict({
 base,
 local,
 remote,
}: {
 base: UserLearningState;
 local: UserLearningState;
 remote: UserLearningState;
}): UserLearningState {
 const settings = { ...remote.settings };
 if (local.settings.lastCourseId !== base.settings.lastCourseId) {
  settings.lastCourseId = local.settings.lastCourseId;
 }
 if (local.settings.lastLessonId !== base.settings.lastLessonId) {
  settings.lastLessonId = local.settings.lastLessonId;
 }
 if (local.settings.lastModule !== base.settings.lastModule) {
  settings.lastModule = local.settings.lastModule;
 }
 if (local.settings.density !== base.settings.density) {
  settings.density = local.settings.density;
 }
 if (local.settings.vocabDetailTab !== base.settings.vocabDetailTab) {
  settings.vocabDetailTab = local.settings.vocabDetailTab;
 }
 const localDisplay = local.settings.lessonTextDisplayMode;
 const baseDisplay = base.settings.lessonTextDisplayMode;
 if (
  localDisplay?.showPinyin !== baseDisplay?.showPinyin ||
  localDisplay?.showMeaning !== baseDisplay?.showMeaning ||
  localDisplay?.showAnswers !== baseDisplay?.showAnswers ||
  localDisplay?.hanziFont !== baseDisplay?.hanziFont ||
  localDisplay?.hanziSize !== baseDisplay?.hanziSize ||
  localDisplay?.revealMode !== baseDisplay?.revealMode
 ) {
  settings.lessonTextDisplayMode = localDisplay;
 }

 const localVocab = local.progress.vocab ?? {};
 const baseVocab = base.progress.vocab ?? {};
 const vocab = { ...(remote.progress.vocab ?? {}) };
 for (const id of new Set([...Object.keys(baseVocab), ...Object.keys(localVocab)])) {
  if (!progressItemsEqual(localVocab[id], baseVocab[id])) {
   const localItem = localVocab[id];
   if (localItem === undefined) delete vocab[id];
   else vocab[id] = localItem;
  }
 }
 const localGrammar = local.progress.grammar ?? {};
 const baseGrammar = base.progress.grammar ?? {};
 const grammar = { ...(remote.progress.grammar ?? {}) };
 for (const id of new Set([...Object.keys(baseGrammar), ...Object.keys(localGrammar)])) {
  if (!progressItemsEqual(localGrammar[id], baseGrammar[id])) {
   const localItem = localGrammar[id];
   if (localItem === undefined) delete grammar[id];
   else grammar[id] = localItem;
  }
 }

 const bookmarks = { ...remote.bookmarks };
 const localLessons = local.bookmarks.lessons ?? [];
 const localVocabBookmarks = local.bookmarks.vocab ?? [];
 const localGrammarBookmarks = local.bookmarks.grammar ?? [];
 const localRadicals = local.bookmarks.radicals ?? [];
 if (!stringListsEqual(localLessons, base.bookmarks.lessons ?? [])) {
  bookmarks.lessons = localLessons;
 }
 if (!stringListsEqual(localVocabBookmarks, base.bookmarks.vocab ?? [])) {
  bookmarks.vocab = localVocabBookmarks;
 }
 if (!stringListsEqual(localGrammarBookmarks, base.bookmarks.grammar ?? [])) {
  bookmarks.grammar = localGrammarBookmarks;
 }
 if (!stringListsEqual(localRadicals, base.bookmarks.radicals ?? [])) {
  bookmarks.radicals = localRadicals;
 }

 const baseReviewKeys = new Set(base.reviewHistory.map(reviewKey));
 const remoteReviewKeys = new Set(remote.reviewHistory.map(reviewKey));
 const reviewHistory = [...remote.reviewHistory];
 for (const item of local.reviewHistory) {
  const key = reviewKey(item);
  if (!baseReviewKeys.has(key) && !remoteReviewKeys.has(key)) {
   reviewHistory.push(item);
   remoteReviewKeys.add(key);
  }
 }

 return normalizeLearningState({
  settings,
  progress: { vocab, grammar },
  bookmarks,
  reviewHistory,
 });
}

function shouldApplySyncResult(
 current: Nullable<PendingLearningStateMutation>,
 syncing: PendingLearningStateMutation,
) {
 return Boolean(current && current.updatedAt === syncing.updatedAt);
}

export async function syncPendingLearningStateMutations(): Promise<LearningStateSyncResult> {
 if (remoteSyncInFlight) return remoteSyncInFlight;

 remoteSyncInFlight = syncPendingLearningStateMutationsOnce().finally(() => {
  remoteSyncInFlight = null;
 });

 return remoteSyncInFlight;
}

async function syncPendingLearningStateMutationsOnce(): Promise<LearningStateSyncResult> {
 if (!isBrowserOnline()) {
  const pending = await listPendingLearningStateMutations().catch(() => []);
  return {
   status: pending.length ? "pending" : "synced",
   syncedCount: 0,
   pendingCount: pending.length,
  };
 }

 const pending = await listPendingLearningStateMutations();
 if (pending.length === 0) {
  return { status: "synced", syncedCount: 0, pendingCount: 0 };
 }

 let syncedCount = 0;
 let latestState: Optional<UserLearningState>;

 for (const mutation of pending) {
  const syncingMutation = await markLearningStateMutationSyncing(mutation);
  let activeMutation = syncingMutation;

  try {
   let saved;
   try {
    saved = await saveHanziHomeLearningState(
     activeMutation.payload,
     activeMutation.expectedUpdatedAt ?? null,
    );
   } catch (error) {
    if (!(error instanceof HanziHomeApiError) || error.status !== 409) throw error;
    const remote = await fetchHanziHomeLearningState();
    const remoteState = normalizeLearningState(remote.state);
    const mergedState = mergeLearningStateAfterConflict({
     base: normalizeLearningState(activeMutation.baseState ?? emptyLearningState),
     local: activeMutation.payload,
     remote: remoteState,
    });
    activeMutation = await replacePendingLearningStateMutation({
     mutation: activeMutation,
     baseState: remoteState,
     state: mergedState,
     expectedUpdatedAt: remote.updatedAt,
    });
    saved = await saveHanziHomeLearningState(mergedState, remote.updatedAt);
   }
   const savedState = normalizeLearningState(saved.state);
   const currentMutation = await readPendingLearningStateMutation();

   if (shouldApplySyncResult(currentMutation, activeMutation)) {
    await writeLocalLearningState({
     state: savedState,
     lastSyncedState: savedState,
     remoteUpdatedAt: saved.updatedAt,
     lastSyncedAt: new Date().toISOString(),
    });
    await clearPendingLearningStateMutation();
    latestState = savedState;
    syncedCount++;
   }
  } catch (error) {
   const currentMutation = await readPendingLearningStateMutation();
   const message = errorMessage(error);

   if (shouldApplySyncResult(currentMutation, activeMutation)) {
    await markLearningStateMutationFailed({
     mutation: activeMutation,
     error: message,
    });
   }

   const remaining = await listPendingLearningStateMutations().catch(() => []);
   return {
    status: "error",
    syncedCount,
    pendingCount: remaining.length,
    state: latestState,
    error: message,
   };
  }
 }

 const remaining = await listPendingLearningStateMutations();
 return {
  status: remaining.length ? "pending" : "synced",
  syncedCount,
  pendingCount: remaining.length,
  state: latestState,
 };
}
